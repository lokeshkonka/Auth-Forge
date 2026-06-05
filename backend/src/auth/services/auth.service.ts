import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { StringValue } from 'ms';

import { PrismaService } from '../../database/prisma.service';
import { SessionsService } from '../../sessions/sessions.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SignupDto } from '../dto/signup.dto';

type TokenPayload = {
  sub: string;
  sessionId: string;
};

type LoginMeta = {
  userAgent?: string;
  ipAddress?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionsService: SessionsService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const slug = dto.organizationSlug.trim().toLowerCase();

    const existingMember = await this.prisma.member.findUnique({
      where: { email },
    });

    if (existingMember) {
      throw new ConflictException({
        statusCode: 409,
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      });
    }

    const existingOrganization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrganization) {
      throw new ConflictException({
        statusCode: 409,
        error: 'ORGANIZATION_SLUG_ALREADY_EXISTS',
        message: 'Organization slug is already taken',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: dto.organizationName.trim(),
            slug,
          },
        });

        const member = await tx.member.create({
          data: {
            email,
            passwordHash,
            firstName: dto.firstName?.trim(),
            lastName: dto.lastName?.trim(),
          },
        });

        const membership = await tx.membership.create({
          data: {
            memberId: member.id,
            organizationId: organization.id,
          },
        });

        await tx.organization.update({
          where: { id: organization.id },
          data: { ownerId: member.id },
        });

        return { organization, member, membership };
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Organization created successfully',
        data: {
          organizationId: result.organization.id,
          memberId: result.member.id,
          membershipId: result.membership.id,
        },
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: 500,
        error: 'SIGNUP_FAILED',
        message: 'Unable to create organization account',
      });
    }
  }

  async login(dto: LoginDto, meta: LoginMeta = {}) {
    const email = dto.email.trim().toLowerCase();
    const member = await this.prisma.member.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      member.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const sessionId = randomUUID();
    const refreshToken = await this.issueRefreshToken(member.id, sessionId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const session = await this.sessionsService.createSession(
      sessionId,
      member.id,
      refreshTokenHash,
      meta.userAgent,
      meta.ipAddress,
    );
    const accessToken = await this.issueAccessToken(member.id, session.id);
    const organizations = await this.prisma.membership.findMany({
      where: { memberId: member.id },
      select: {
        id: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        memberId: member.id,
        email: member.email,
        sessionId: session.id,
        accessToken,
        refreshToken,
        organizations,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const refreshSecret = this.configService.getOrThrow<string>(
      'JWT_REFRESH_SECRET',
    );

    const payload = await this.jwtService.verifyAsync<TokenPayload>(
      dto.refreshToken,
      { secret: refreshSecret },
    );

    const session = await this.sessionsService.findActiveSessionById(
      payload.sessionId,
    );

    if (!session) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
      });
    }

    const refreshTokenMatches = await bcrypt.compare(
      dto.refreshToken,
      session.refreshTokenHash,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
      });
    }

    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid',
      });
    }

    const newRefreshToken = await this.issueRefreshToken(
      member.id,
      session.id,
    );
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    await this.sessionsService.updateRefreshTokenHash(
      session.id,
      refreshTokenHash,
    );
    const accessToken = await this.issueAccessToken(member.id, session.id);

    return {
      success: true,
      statusCode: 200,
      message: 'Token refreshed successfully',
      data: {
        memberId: member.id,
        email: member.email,
        sessionId: session.id,
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  async getProfile(memberId: string, sessionId: string) {
    const session = await this.sessionsService.findActiveSessionById(sessionId);

    if (!session || session.memberId !== memberId) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_SESSION',
        message: 'Session is no longer valid',
      });
    }

    return this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                ownerId: true,
                createdAt: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        ownedOrganizations: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async logout(sessionId: string) {
    const session = await this.sessionsService.findActiveSessionById(sessionId);

    if (!session) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_SESSION',
        message: 'Session is no longer valid',
      });
    }

    const result = await this.sessionsService.deleteMemberSession(
      sessionId,
      session.memberId,
    );

    if (result.count === 0) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_SESSION',
        message: 'Session is no longer valid',
      });
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Logout successful',
    };
  }

  async getSessions(memberId: string, currentSessionId: string) {
    const sessions = await this.sessionsService.findSessionsByMemberId(memberId);

    return {
      success: true,
      statusCode: 200,
      message: 'Sessions fetched successfully',
      data: sessions.map((session) => ({
        ...session,
        current: session.id === currentSessionId,
      })),
    };
  }

  async deleteSession(
    memberId: string,
    currentSessionId: string,
    targetSessionId: string,
  ) {
    if (currentSessionId === targetSessionId) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'CURRENT_SESSION',
        message: 'Use logout endpoint to terminate current session',
      });
    }

    const result = await this.sessionsService.deleteMemberSession(
      targetSessionId,
      memberId,
    );

    if (result.count === 0) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      });
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Session deleted successfully',
    };
  }

  private async issueAccessToken(memberId: string, sessionId: string) {
    const payload: TokenPayload = {
      sub: memberId,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<StringValue>('JWT_EXPIRES_IN') ?? '15m',
    });
  }

  private async issueRefreshToken(memberId: string, sessionId: string) {
    const payload: TokenPayload = {
      sub: memberId,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }
}
