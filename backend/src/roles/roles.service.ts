import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, createRoleDto: CreateRoleDto, actorId?: string) {
    const { name, description, permissionIds } = createRoleDto;

    const existingRole = await this.prisma.role.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name,
        },
      },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name \${name} already exists in this organization`);
    }

    const role = await this.prisma.role.create({
      data: {
        organizationId,
        name,
        description,
        permissions: permissionIds ? {
          create: permissionIds.map(permissionId => ({
            permission: { connect: { id: permissionId } }
          }))
        } : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        actorId,
        action: 'role.created',
        resourceType: 'Role',
        resourceId: role.id,
        newValue: { name, description, permissionIds } as any,
      }
    });

    return role;
  }

  async findAll(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  }

  async findOne(organizationId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, organizationId },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException(`Role with ID \${id} not found`);
    }

    return role;
  }

  async update(organizationId: string, id: string, updateRoleDto: UpdateRoleDto, actorId?: string) {
    const { name, description, permissionIds } = updateRoleDto;

    const role = await this.findOne(organizationId, id);

    if (role.isSystemRole) {
       throw new ConflictException('Cannot update system roles directly');
    }

    if (name && name !== role.name) {
      const existingRole = await this.prisma.role.findUnique({
        where: {
          organizationId_name: {
            organizationId,
            name,
          },
        },
      });

      if (existingRole) {
        throw new ConflictException(`Role with name \${name} already exists in this organization`);
      }
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        ...(permissionIds && {
          permissions: {
            deleteMany: {},
            create: permissionIds.map(permissionId => ({
              permission: { connect: { id: permissionId } }
            }))
          }
        })
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        actorId,
        action: 'role.updated',
        resourceType: 'Role',
        resourceId: id,
        oldValue: { name: role.name, description: role.description } as any,
        newValue: { name, description, permissionIds } as any,
      }
    });

    return updatedRole;
  }

  async remove(organizationId: string, id: string, actorId?: string) {
    const role = await this.findOne(organizationId, id);
    if (role.isSystemRole) {
       throw new ConflictException('Cannot delete system roles');
    }

    const deleted = await this.prisma.role.delete({
      where: { id },
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        actorId,
        action: 'role.deleted',
        resourceType: 'Role',
        resourceId: id,
        oldValue: { name: role.name } as any,
      }
    });

    return deleted;
  }
}
