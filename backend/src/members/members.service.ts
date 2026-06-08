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
        isOwner: true,
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

  async getMemberPermissions(memberId: string, organizationId: string): Promise<string[]> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        memberId_organizationId: {
          memberId,
          organizationId,
        },
      },
      include: {
        roles: {
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

    if (!membership) return [];

    // Check if user is organization owner
    if (membership.isOwner) {
      const allPermissions = await this.prisma.permission.findMany({ select: { key: true } });
      return allPermissions.map(p => p.key);
    }

    const permissions = new Set<string>();
    for (const memberRole of membership.roles) {
      for (const rp of memberRole.role.permissions) {
        permissions.add(rp.permission.key);
      }
    }

    return Array.from(permissions);
  }
}
