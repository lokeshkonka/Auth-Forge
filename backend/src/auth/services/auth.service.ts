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
import { AuditService } from '../../audit/services/audit.service';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SignupDto } from '../dto/signup.dto';

type TokenPayload = {
  sub: string;
  sessionId: string;
  exp: number;
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
    private readonly auditService: AuditService,
    private readonly tokenBlacklistService: TokenBlacklistService,
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
        // 1. Create Organization
        const organization = await tx.organization.create({
          data: {
            name: dto.organizationName.trim(),
            slug,
          },
        });

        // 2. Create Member
        const member = await tx.member.create({
          data: {
            email,
            passwordHash,
            firstName: dto.firstName?.trim(),
            lastName: dto.lastName?.trim(),
          },
        });

        // 3. Create Membership
        const membership = await tx.membership.create({
          data: {
            memberId: member.id,
            organizationId: organization.id,
            isOwner: true,
          },
        });

        // 4. Update Organization Owner
        await tx.organization.update({
          where: { id: organization.id },
          data: { ownerId: member.id },
        });

        // 5. Create Owner Role for this organization
        const ownerRole = await tx.role.create({
          data: {
            organizationId: organization.id,
            name: 'Owner',
            description: 'Full access to the organization',
            isSystemRole: true,
          }
        });

        // 7. Assign Owner Role to the Member's Membership
        await tx.memberRole.create({
          data: {
            membershipId: membership.id,
            roleId: ownerRole.id
          }
        });

        // 8. Log organization creation
        await tx.auditLog.create({
          data: {
            organizationId: organization.id,
            actorId: member.id,
            action: 'customer.signup',
            resourceType: 'Organization',
            resourceId: organization.id,
            newValue: { name: organization.name, slug: organization.slug },
          }
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
    } catch (error) {
      console.error('Signup error:', error);
      throw new InternalServerErrorException({
        statusCode: 500,
        error: 'SIGNUP_FAILED',
        message: 'Unable to create organization account',
      });
    }
  }

  async googleLogin(profile: any, meta: LoginMeta = {}) {
    if (!profile) {
      throw new UnauthorizedException('No user from google');
    }
    
    let member = await this.prisma.member.findUnique({
      where: { email: profile.email.toLowerCase() },
    });

    if (!member) {
      member = await this.prisma.member.create({
        data: {
          email: profile.email.toLowerCase(),
          firstName: profile.firstName,
          lastName: profile.lastName,
        }
      });
    }

    await this.prisma.identity.upsert({
      where: {
        provider_providerUserId: {
          provider: 'GOOGLE',
          providerUserId: profile.providerUserId
        }
      },
      update: {
        memberId: member.id,
      },
      create: {
        provider: 'GOOGLE',
        providerUserId: profile.providerUserId,
        email: profile.email,
        memberId: member.id,
      }
    });

    const sessionId = randomUUID();
    const refreshToken = await this.issueRefreshToken(member.id, sessionId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.sessionsService.createSession(
      sessionId,
      member.id,
      refreshTokenHash,
      meta.userAgent,
      meta.ipAddress,
    );

    const accessToken = await this.issueAccessToken(member.id, sessionId);

    await this.logMemberEvent(member.id, 'google.login', 'Session', sessionId, meta);

    return {
      success: true,
      statusCode: 200,
      data: {
        accessToken,
        refreshToken,
      },
    };
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

    if (!member || !member.passwordHash) {
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

    await this.sessionsService.createSession(
      sessionId,
      member.id,
      refreshTokenHash,
      meta.userAgent,
      meta.ipAddress,
    );

    const accessToken = await this.issueAccessToken(member.id, sessionId);

    await this.logMemberEvent(member.id, 'customer.login', 'Session', sessionId, meta);

    return {
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: {
        memberId: member.id,
        email: member.email,
        sessionId,
        accessToken,
        refreshToken,
      },
    };
  }

  private async logMemberEvent(memberId: string, action: string, resourceType: string, resourceId?: string, meta: LoginMeta = {}) {
    const memberships = await this.prisma.membership.findMany({
      where: { memberId },
    });

    for (const membership of memberships) {
      await this.auditService.createLog({
        organizationId: membership.organizationId,
        actorId: memberId,
        action,
        resourceType,
        resourceId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }

    if (memberships.length === 0) {
      const systemOrg = await this.prisma.organization.findUnique({ where: { slug: 'system' } });
      if (systemOrg) {
        await this.auditService.createLog({
          organizationId: systemOrg.id,
          actorId: memberId,
          action,
          resourceType,
          resourceId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        });
      }
    }
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.jwtService
      .verifyAsync<TokenPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
      .catch(() => {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid or expired',
        });
      });

    const session = await this.sessionsService.findActiveSessionById(
      payload.sessionId,
    );

    if (!session || session.memberId !== payload.sub) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_SESSION',
        message: 'Session is no longer valid',
      });
    }

    const isTokenValid = await bcrypt.compare(
      dto.refreshToken,
      session.refreshTokenHash,
    );

    if (!isTokenValid) {
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

  async logout(sessionId: string, token: string) {
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

    // Blacklist access token
    try {
      const payload = this.jwtService.decode(token) as TokenPayload;
      if (payload && payload.exp) {
        const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.tokenBlacklistService.blacklistToken(token, expiresIn);
        }
      }
    } catch (err) {
      console.error('Failed to blacklist token:', err);
    }

    await this.logMemberEvent(session.memberId, 'customer.logout', 'Session', sessionId);

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
        id: session.id,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        current: session.id === currentSessionId,
      })),
    };
  }

  async revokeAllSessions(memberId: string, currentSessionId: string) {
    await this.sessionsService.revokeAllSessions(memberId, currentSessionId);

    return {
      success: true,
      statusCode: 200,
      message: 'All other sessions revoked successfully',
    };
  }

  async deleteSession(
    memberId: string,
    currentSessionId: string,
    sessionIdToDelete: string,
  ) {
    if (sessionIdToDelete === 'all') {
      return this.revokeAllSessions(memberId, currentSessionId);
    }

    const session = await this.sessionsService.findSessionById(
      sessionIdToDelete,
    );

    if (!session || session.memberId !== memberId) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'SESSION_NOT_FOUND',
        message: 'Session not found',
      });
    }

    await this.sessionsService.deleteMemberSession(sessionIdToDelete, memberId);

    return {
      success: true,
      statusCode: 200,
      message: 'Session deleted successfully',
    };
  }

  private async issueAccessToken(memberId: string, sessionId: string) {
    return this.jwtService.signAsync(
      { sub: memberId, sessionId },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn:
          this.configService.get<StringValue>('JWT_EXPIRES_IN') ?? '15m',
      },
    );
  }

  private async issueRefreshToken(memberId: string, sessionId: string) {
    return this.jwtService.signAsync(
      { sub: memberId, sessionId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      },
    );
  }
}
