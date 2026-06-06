import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/services/audit.service';
import { CreateAppRoleDto, UpdateAppRoleDto } from '../dto/app-role.dto';

@Injectable()
export class AppRolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appId: string, dto: CreateAppRoleDto, organizationId: string, actorId?: string) {
    const { name, description, permissionIds } = dto;

    const existing = await this.prisma.applicationRole.findUnique({
      where: {
        applicationId_name: {
          applicationId: appId,
          name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Role with name \${name} already exists in this application`);
    }

    const role = await this.prisma.applicationRole.create({
      data: {
        applicationId: appId,
        name,
        description,
        permissions: permissionIds ? {
          create: permissionIds.map(permissionId => ({
            permission: { connect: { id: permissionId } }
          }))
        } : undefined,
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_role.created',
      resourceType: 'ApplicationRole',
      resourceId: role.id,
      newValue: dto,
    });

    return role;
  }

  async findAll(appId: string) {
    return this.prisma.applicationRole.findMany({
      where: { applicationId: appId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findOne(appId: string, id: string) {
    const role = await this.prisma.applicationRole.findFirst({
      where: { id, applicationId: appId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID \${id} not found`);
    }

    return role;
  }

  async update(appId: string, id: string, dto: UpdateAppRoleDto, organizationId: string, actorId?: string) {
    const role = await this.findOne(appId, id);

    const updated = await this.prisma.applicationRole.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.permissionIds && {
          permissions: {
            deleteMany: {},
            create: dto.permissionIds.map(permissionId => ({
              permission: { connect: { id: permissionId } }
            }))
          }
        })
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_role.updated',
      resourceType: 'ApplicationRole',
      resourceId: id,
      oldValue: { name: role.name, description: role.description },
      newValue: dto,
    });

    return updated;
  }

  async remove(appId: string, id: string, organizationId: string, actorId?: string) {
    const role = await this.findOne(appId, id);

    await this.prisma.applicationRole.delete({
      where: { id },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_role.deleted',
      resourceType: 'ApplicationRole',
      resourceId: id,
      oldValue: { name: role.name },
    });

    return { success: true };
  }

  async assignToUser(appId: string, userId: string, roleId: string, organizationId: string, actorId?: string) {
    // Verify user and role belong to the same application
    const [user, role] = await Promise.all([
      this.prisma.endUser.findFirst({ where: { id: userId, applicationId: appId } }),
      this.prisma.applicationRole.findFirst({ where: { id: roleId, applicationId: appId } }),
    ]);

    if (!user || !role) {
      throw new NotFoundException('User or Role not found in this application');
    }

    const assignment = await this.prisma.endUserRoleAssignment.upsert({
      where: {
        endUserId_roleId: {
          endUserId: userId,
          roleId,
        },
      },
      update: {},
      create: {
        endUserId: userId,
        roleId,
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_role.assigned',
      resourceType: 'EndUserRoleAssignment',
      resourceId: `\${userId}_\${roleId}`,
      newValue: { userId, roleId },
    });

    return assignment;
  }

  async unassignFromUser(appId: string, userId: string, roleId: string, organizationId: string, actorId?: string) {
    await this.prisma.endUserRoleAssignment.delete({
      where: {
        endUserId_roleId: {
          endUserId: userId,
          roleId,
        },
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_role.unassigned',
      resourceType: 'EndUserRoleAssignment',
      resourceId: `\${userId}_\${roleId}`,
      oldValue: { userId, roleId },
    });

    return { success: true };
  }
}
