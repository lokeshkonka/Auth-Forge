import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
import { SignupDto } from '../dto/signup.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

type TokenPayload = {
  sub: string;
  organizationId: string;
  email: string;
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
            organizationId: organization.id,
          },
        });

        await tx.organization.update({
          where: { id: organization.id },
          data: { ownerId: member.id },
        });

        return { organization, member };
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Organization created successfully',
        data: {
          organizationId: result.organization.id,
          memberId: result.member.id,
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
    const refreshToken = await this.issueRefreshToken(
      member.id,
      member.organizationId,
      member.email,
      sessionId,
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const session = await this.sessionsService.createSession(
      sessionId,
      member.id,
      refreshTokenHash,
      meta.userAgent,
      meta.ipAddress,
    );
    const accessToken = await this.issueAccessToken(
      member.id,
      member.organizationId,
      member.email,
      session.id,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        memberId: member.id,
        organizationId: member.organizationId,
        email: member.email,
        sessionId: session.id,
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const refreshSecret = this.configService.getOrThrow<string>(
      'JWT_REFRESH_SECRET',
    );

    const payload = await this.jwtService.verifyAsync<TokenPayload>(
      dto.refreshToken,
      {
        secret: refreshSecret,
      },
    );

    const session = await this.sessionsService.findActiveSessionById(
      payload.sessionId,
    );

    if (!session || session.expiresAt <= new Date()) {
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
      member.organizationId,
      member.email,
      session.id,
    );
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    await this.sessionsService.updateRefreshTokenHash(session.id, refreshTokenHash);
    const accessToken = await this.issueAccessToken(
      member.id,
      member.organizationId,
      member.email,
      session.id,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Token refreshed successfully',
      data: {
        memberId: member.id,
        organizationId: member.organizationId,
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
        organizationId: true,
        createdAt: true,
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

    await this.sessionsService.deleteSession(sessionId);

    return {
      success: true,
      statusCode: 200,
      message: 'Logout successful',
    };
  }

  private async issueAccessToken(
    memberId: string,
    organizationId: string,
    email: string,
    sessionId: string,
  ) {
    const payload: TokenPayload = {
      sub: memberId,
      organizationId,
      email,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<StringValue>('JWT_EXPIRES_IN') ?? '15m',
    });
  }

  private async issueRefreshToken(
    memberId: string,
    organizationId: string,
    email: string,
    sessionId: string,
  ) {
    const payload: TokenPayload = {
      sub: memberId,
      organizationId,
      email,
      sessionId,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  async getSessions(
    memberId: string,
    currentSessionId: string,
  ) {
    const sessions =
      await this.sessionsService.findSessionsByMemberId(
        memberId,
      );
  
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
}
