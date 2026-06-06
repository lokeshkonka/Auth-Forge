import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/services/audit.service';
import { CreateAppPermissionDto } from '../dto/app-permission.dto';

@Injectable()
export class AppPermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appId: string, dto: CreateAppPermissionDto, organizationId: string, actorId?: string) {
    const { name, description } = dto;

    const existing = await this.prisma.applicationPermission.findUnique({
      where: {
        applicationId_name: {
          applicationId: appId,
          name,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Permission with name \${name} already exists in this application`);
    }

    const permission = await this.prisma.applicationPermission.create({
      data: {
        applicationId: appId,
        name,
        description,
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_permission.created',
      resourceType: 'ApplicationPermission',
      resourceId: permission.id,
      newValue: dto,
    });

    return permission;
  }

  async findAll(appId: string) {
    return this.prisma.applicationPermission.findMany({
      where: { applicationId: appId },
    });
  }

  async remove(appId: string, id: string, organizationId: string, actorId?: string) {
    const permission = await this.prisma.applicationPermission.findFirst({
      where: { id, applicationId: appId },
    });

    if (!permission) {
      throw new NotFoundException(`Permission with ID \${id} not found`);
    }

    await this.prisma.applicationPermission.delete({
      where: { id },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_permission.deleted',
      resourceType: 'ApplicationPermission',
      resourceId: id,
      oldValue: { name: permission.name },
    });

    return { success: true };
  }
}
