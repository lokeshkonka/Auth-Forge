import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  createSession(
    id: string,
    memberId: string,
    refreshTokenHash: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    return this.prisma.memberSession.create({
      data: {
        id,
        memberId,
        refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
  }

  updateRefreshTokenHash(id: string, refreshTokenHash: string) {
    return this.prisma.memberSession.update({
      where: { id },
      data: {
        refreshTokenHash,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        lastUsedAt: new Date(),
      },
    });
  }

  findSessionById(id: string) {
    return this.prisma.memberSession.findUnique({
      where: { id },
    });
  }

  async findActiveSessionById(id: string) {
    const session = await this.prisma.memberSession.findFirst({
      where: {
        id,
        expiresAt: {
          gt: new Date(),
        },
        revokedAt: null,
      },
    });

    if (session) {
      await this.prisma.memberSession.update({
        where: { id },
        data: { lastUsedAt: new Date() }
      });
    }

    return session;
  }

  findSessionsByMemberId(memberId: string) {
    return this.prisma.memberSession.findMany({
      where: {
        memberId,
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

  revokeSession(sessionId: string, memberId: string) {
    return this.prisma.memberSession.updateMany({
      where: {
        id: sessionId,
        memberId,
      },
      data: {
        revokedAt: new Date(),
      }
    });
  }

  revokeAllSessions(memberId: string, excludeSessionId?: string) {
    return this.prisma.memberSession.updateMany({
      where: {
        memberId,
        ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      }
    });
  }

  deleteMemberSession(sessionId: string, memberId: string) {
    return this.revokeSession(sessionId, memberId);
  }
}
