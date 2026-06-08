import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

@Injectable()
export class EndUserSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  createSession(
    id: string,
    endUserId: string,
    refreshTokenHash: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    return this.prisma.endUserSession.create({
      data: {
        id,
        endUserId,
        refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
  }

  updateRefreshTokenHash(id: string, refreshTokenHash: string) {
    return this.prisma.endUserSession.update({
      where: { id },
      data: {
        refreshTokenHash,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        lastUsedAt: new Date(),
      },
    });
  }

  findSessionById(id: string) {
    return this.prisma.endUserSession.findUnique({
      where: { id },
    });
  }

  async findActiveSessionById(id: string) {
    const session = await this.prisma.endUserSession.findFirst({
      where: {
        id,
        expiresAt: {
          gt: new Date(),
        },
        revokedAt: null,
      },
    });

    if (session) {
      await this.prisma.endUserSession.update({
        where: { id },
        data: { lastUsedAt: new Date() }
      });
    }

    return session;
  }

  findSessionsByEndUserId(endUserId: string) {
    return this.prisma.endUserSession.findMany({
      where: {
        endUserId,
        expiresAt: {
          gt: new Date(),
        },
        revokedAt: null,
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  revokeSession(sessionId: string, endUserId: string) {
    return this.prisma.endUserSession.updateMany({
      where: {
        id: sessionId,
        endUserId,
      },
      data: {
        revokedAt: new Date(),
      }
    });
  }

  revokeAllSessions(endUserId: string, excludeSessionId?: string) {
    return this.prisma.endUserSession.updateMany({
      where: {
        endUserId,
        ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      }
    });
  }
}
