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
      },
    });
  }

  findSessionById(id: string) {
    return this.prisma.memberSession.findUnique({
      where: { id },
    });
  }

  findActiveSessionById(id: string) {
    return this.prisma.memberSession.findFirst({
      where: {
        id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  findSessionsByMemberId(memberId: string) {
    return this.prisma.memberSession.findMany({
      where: {
        memberId,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  deleteMemberSession(sessionId: string, memberId: string) {
    return this.prisma.memberSession.deleteMany({
      where: {
        id: sessionId,
        memberId,
      },
    });
  }
}
