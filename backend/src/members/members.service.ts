import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  findMembershipsByMemberId(memberId: string) {
    return this.prisma.membership.findMany({
      where: { memberId },
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
  }

  findMembershipByMemberAndOrganization(
    memberId: string,
    organizationId: string,
  ) {
    return this.prisma.membership.findUnique({
      where: {
        memberId_organizationId: {
          memberId,
          organizationId,
        },
      },
    });
  }

  createMembership(memberId: string, organizationId: string) {
    return this.prisma.membership.create({
      data: {
        memberId,
        organizationId,
      },
    });
  }
}
