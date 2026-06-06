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
      throw new ConflictException('An account with this email already exists in this application');
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

  async login(appId: string, dto: EndUserLoginDto) {
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = randomUUID();
    const refreshToken = await this.issueRefreshToken(user.id, sessionId, appId);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.sessionsService.createSession(sessionId, user.id, refreshTokenHash);

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
       throw new UnauthorizedException('Token is not valid for this application');
    }

    const session = await this.sessionsService.findActiveSessionById(payload.sessionId);

    if (!session || session.endUserId !== payload.sub) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    const isTokenValid = await bcrypt.compare(dto.refreshToken, session.refreshTokenHash);

    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const newRefreshToken = await this.issueRefreshToken(payload.sub, session.id, appId);
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    await this.sessionsService.updateRefreshTokenHash(session.id, refreshTokenHash);
    
    const accessToken = await this.issueAccessToken(payload.sub, session.id, appId);

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
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getSessions(userId: string) {
    const sessions = await this.sessionsService.findSessionsByEndUserId(userId);
    return {
      success: true,
      statusCode: 200,
      data: sessions,
    };
  }

  private async issueAccessToken(userId: string, sessionId: string, appId: string) {
    return this.jwtService.signAsync(
      { sub: userId, sessionId, appId },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<StringValue>('JWT_EXPIRES_IN') ?? '15m',
      },
    );
  }

  private async issueRefreshToken(userId: string, sessionId: string, appId: string) {
    return this.jwtService.signAsync(
      { sub: userId, sessionId, appId },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
      },
    );
  }
}
