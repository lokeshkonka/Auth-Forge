import {
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
import { EndUserSessionsService } from '../../sessions/services/end-user-sessions.service';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';
import { AuditService } from '../../audit/services/audit.service';
import { EndUserSignupDto } from '../dto/signup.dto';
import { EndUserLoginDto } from '../dto/login.dto';
import { EndUserRefreshTokenDto } from '../dto/refresh-token.dto';

type TokenPayload = {
  sub: string;
  sessionId: string;
  appId: string;
  exp: number;
};

@Injectable()
export class EndUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionsService: EndUserSessionsService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly auditService: AuditService,
  ) {}

  async signup(appId: string, dto: EndUserSignupDto) {
    const email = dto.email.trim().toLowerCase();

    // Verify application exists
    const application = await this.prisma.application.findUnique({
      where: { id: appId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const existingUser = await this.prisma.endUser.findUnique({
      where: {
        applicationId_email: {
          applicationId: appId,
          email,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists in this application',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.endUser.create({
        data: {
          applicationId: appId,
          email,
          passwordHash,
        },
      });

      await this.auditService.createLog({
        organizationId: application.organizationId,
        action: 'end_user.created',
        resourceType: 'EndUser',
        resourceId: user.id,
        newValue: { email: user.email, applicationId: appId },
      });

      return {
        success: true,
        statusCode: 201,
        message: 'End user created successfully',
        data: {
          userId: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('End user signup error:', error);
      throw new InternalServerErrorException('Unable to create end user');
    }
  }

  async login(
    appId: string,
    dto: EndUserLoginDto,
    meta: { userAgent?: string; ipAddress?: string } = {},
  ) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.endUser.findUnique({
      where: {
        applicationId_email: {
          applicationId: appId,
          email,
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = randomUUID();
    const refreshToken = await this.issueRefreshToken(
      user.id,
      sessionId,
      appId,
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.sessionsService.createSession(
      sessionId,
      user.id,
      refreshTokenHash,
      meta.userAgent,
      meta.ipAddress,
    );

    const accessToken = await this.issueAccessToken(user.id, sessionId, appId);

    return {
      success: true,
      statusCode: 200,
      data: {
        accessToken,
        refreshToken,
        userId: user.id,
      },
    };
  }

  async refresh(appId: string, dto: EndUserRefreshTokenDto) {
    const payload = await this.jwtService
      .verifyAsync<TokenPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
      .catch(() => {
        throw new UnauthorizedException('Refresh token is invalid or expired');
      });

    if (payload.appId !== appId) {
      throw new UnauthorizedException(
        'Token is not valid for this application',
      );
    }

    const session = await this.sessionsService.findActiveSessionById(
      payload.sessionId,
    );

    if (!session || session.endUserId !== payload.sub) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    const isTokenValid = await bcrypt.compare(
      dto.refreshToken,
      session.refreshTokenHash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const newRefreshToken = await this.issueRefreshToken(
      payload.sub,
      session.id,
      appId,
    );
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    await this.sessionsService.updateRefreshTokenHash(
      session.id,
      refreshTokenHash,
    );

    const accessToken = await this.issueAccessToken(
      payload.sub,
      session.id,
      appId,
    );

    return {
      success: true,
      statusCode: 200,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  async logout(sessionId: string, userId: string, token: string) {
    const session = await this.sessionsService.findActiveSessionById(sessionId);

    if (!session || session.endUserId !== userId) {
      throw new UnauthorizedException('Session not found');
    }

    await this.sessionsService.revokeSession(sessionId, userId);

    // Blacklist access token
    try {
      const payload = this.jwtService.decode(token);
      if (payload && payload.exp) {
        const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await this.tokenBlacklistService.blacklistToken(token, expiresIn);
        }
      }
    } catch (err) {
      console.error('Failed to blacklist token:', err);
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Logout successful',
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.endUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionsService.findSessionsByEndUserId(userId);
    return {
      success: true,
      statusCode: 200,
      message: 'Sessions fetched successfully',
      data: sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        lastUsedAt: s.lastUsedAt,
        current: s.id === currentSessionId,
      })),
    };
  }

  async findAllUsers(applicationId: string) {
    const users = await this.prisma.endUser.findMany({
      where: { applicationId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      statusCode: 200,
      data: users,
    };
  }

  async createUser(applicationId: string, dto: EndUserSignupDto) {
    return this.signup(applicationId, dto);
  }

  async updateUser(
    applicationId: string,
    id: string,
    dto: { email?: string; password?: string },
  ) {
    const user = await this.prisma.endUser.findFirst({
      where: { id, applicationId },
      include: { application: true },
    });

    if (!user) {
      throw new NotFoundException('User not found in this application');
    }

    const data: any = {};
    if (dto.email) {
      data.email = dto.email.trim().toLowerCase();
    }
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.endUser.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        updatedAt: true,
      },
    });

    await this.auditService.createLog({
      organizationId: user.application.organizationId,
      action: 'end_user.updated',
      resourceType: 'EndUser',
      resourceId: id,
      oldValue: { email: user.email },
      newValue: { email: updated.email },
    });

    return {
      success: true,
      statusCode: 200,
      data: updated,
    };
  }

  async deleteUser(applicationId: string, id: string) {
    const user = await this.prisma.endUser.findFirst({
      where: { id, applicationId },
      include: { application: true },
    });

    if (!user) {
      throw new NotFoundException('User not found in this application');
    }

    await this.prisma.endUser.delete({
      where: { id },
    });

    await this.auditService.createLog({
      organizationId: user.application.organizationId,
      action: 'end_user.deleted',
      resourceType: 'EndUser',
      resourceId: id,
      oldValue: { email: user.email },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'User deleted successfully',
    };
  }

  async bulkImportUsers(applicationId: string, users: EndUserSignupDto[]) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const userDto of users) {
      try {
        await this.signup(applicationId, userDto);
        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(
          `Failed to import ${userDto.email}: ${error.message}`,
        );
      }
    }

    await this.auditService.createLog({
      organizationId: application.organizationId,
      action: 'bulk_import.completed',
      resourceType: 'Application',
      resourceId: applicationId,
      newValue: { created: results.created, failed: results.failed },
    });

    return {
      success: true,
      statusCode: 200,
      data: results,
    };
  }

  async revokeSession(userId: string, sessionIdToRevoke: string) {
    const session =
      await this.sessionsService.findActiveSessionById(sessionIdToRevoke);
    if (!session || session.endUserId !== userId) {
      throw new NotFoundException('Session not found');
    }
    await this.sessionsService.revokeSession(sessionIdToRevoke, userId);
    return {
      success: true,
      statusCode: 200,
      message: 'Session revoked successfully',
    };
  }

  async revokeAllSessions(userId: string, currentSessionId: string) {
    await this.sessionsService.revokeAllSessions(userId, currentSessionId);
    return {
      success: true,
      statusCode: 200,
      message: 'All other sessions revoked successfully',
    };
  }

  private async issueAccessToken(
    userId: string,
    sessionId: string,
    appId: string,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, sessionId, appId },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn:
          this.configService.get<StringValue>('JWT_EXPIRES_IN') ?? '15m',
      },
    );
  }

  private async issueRefreshToken(
    userId: string,
    sessionId: string,
    appId: string,
  ) {
    return this.jwtService.signAsync(
      { sub: userId, sessionId, appId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn:
          this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      },
    );
  }
}
