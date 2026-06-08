import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface Permission {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string | null;
  sortOrder: number;
}

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { sortOrder: 'asc' },
    }) as Permission[];

    const categories = permissions.reduce((acc, perm) => {
      const category = perm.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: perm.id,
        key: perm.key,
        name: perm.name,
        description: perm.description,
        sortOrder: perm.sortOrder,
      });
      return acc;
    }, {} as Record<string, Partial<Permission>[]>);

    return {
      success: true,
      statusCode: 200,
      data: {
        total: permissions.length,
        list: permissions.map(p => ({
          id: p.id,
          key: p.key,
          name: p.name,
          category: p.category,
          description: p.description
        })),
        categories
      }
    };
  }

  async findByOrganization(organizationId: string, memberId: string) {
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

    if (!membership) {
      throw new Error('Membership not found');
    }

    // Check if user is organization owner via membership flag
    const isOwner = membership.isOwner;
    
    let permissions: Permission[];
    
    if (isOwner) {
      // Owners see all permissions
      permissions = await this.prisma.permission.findMany({
        orderBy: { sortOrder: 'asc' },
      }) as Permission[];
    } else {
      // Members see only their assigned permissions
      const permissionMap = new Map<string, Permission>();
      for (const memberRole of membership.roles) {
        for (const rp of memberRole.role.permissions) {
          permissionMap.set(rp.permission.id, rp.permission as Permission);
        }
      }
      permissions = Array.from(permissionMap.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    const categories = permissions.reduce((acc, perm) => {
      const category = perm.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: perm.id,
        key: perm.key,
        name: perm.name,
        description: perm.description,
        sortOrder: perm.sortOrder,
      });
      return acc;
    }, {} as Record<string, Partial<Permission>[]>);

    return {
      success: true,
      statusCode: 200,
      data: {
        total: permissions.length,
        isOwner,
        list: permissions.map(p => ({
          id: p.id,
          key: p.key,
          name: p.name,
          category: p.category,
          description: p.description
        })),
        categories
      }
    };
  }
}
