import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/services/audit.service';
import {
  CreateAppPermissionDto,
  UpdateAppPermissionDto,
} from '../dto/app-permission.dto';

@Injectable()
export class AppPermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    appId: string,
    dto: CreateAppPermissionDto,
    organizationId: string,
    actorId?: string,
  ) {
    const existing = await this.prisma.applicationPermission.findUnique({
      where: {
        applicationId_key: {
          applicationId: appId,
          key: dto.key,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Permission with key ${dto.key} already exists in this application`,
      );
    }

    const permission = await this.prisma.applicationPermission.create({
      data: {
        applicationId: appId,
        ...dto,
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

  async update(
    appId: string,
    id: string,
    dto: UpdateAppPermissionDto,
    organizationId: string,
    actorId?: string,
  ) {
    const permission = await this.prisma.applicationPermission.findFirst({
      where: { id, applicationId: appId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const updated = await this.prisma.applicationPermission.update({
      where: { id },
      data: dto,
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'app_permission.updated',
      resourceType: 'ApplicationPermission',
      resourceId: id,
      oldValue: permission,
      newValue: dto,
    });

    return updated;
  }

  async remove(
    appId: string,
    id: string,
    organizationId: string,
    actorId?: string,
  ) {
    const permission = await this.prisma.applicationPermission.findFirst({
      where: { id, applicationId: appId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
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
      oldValue: permission,
    });

    return { success: true };
  }
}
