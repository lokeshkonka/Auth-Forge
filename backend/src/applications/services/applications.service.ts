import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/services/audit.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationDto } from '../dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateApplicationDto,
    actorId?: string,
  ) {
    const { name, slug, description } = dto;
    const existing = await this.prisma.application.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Application with slug ${slug} already exists in this organization`,
      );
    }

    const application = await this.prisma.application.create({
      data: {
        organizationId,
        name,
        slug,
        description,
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'application.created',
      resourceType: 'Application',
      resourceId: application.id,
      newValue: { name, slug, description },
    });

    return application;
  }

  async findAll(organizationId: string) {
    return this.prisma.application.findMany({
      where: { organizationId },
    });
  }

  async getStats(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    const [userCount, apiKeyCount] = await Promise.all([
      this.prisma.endUser.count({ where: { applicationId: id } }),
      this.prisma.apiKey.count({ where: { applicationId: id } }),
    ]);

    // Generate last 7 days for trends
    const trends: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Count audit logs for this application on this day
      // We look for logs where resourceType is Application (resourceId is app.id)
      // OR where resourceType is EndUser and they belong to this application
      const count = await this.prisma.auditLog.count({
        where: {
          organizationId,
          createdAt: {
            gte: new Date(dateString),
            lt: new Date(new Date(dateString).getTime() + 86400000),
          },
          OR: [
            { resourceType: 'Application', resourceId: id },
            { resourceType: 'ApiKey', resourceId: { in: await this.prisma.apiKey.findMany({ where: { applicationId: id }, select: { id: true } }).then(keys => keys.map(k => k.id)) } },
            { resourceType: 'EndUser', resourceId: { in: await this.prisma.endUser.findMany({ where: { applicationId: id }, select: { id: true } }).then(users => users.map(u => u.id)) } }
          ]
        },
      });

      trends.push({ date: dateString, count });
    }

    return {
      userCount,
      apiKeyCount,
      trends,
    };
  }

  async findAllUsers(organizationId: string, applicationId: string) {
    await this.findOne(organizationId, applicationId);
    const users = await this.prisma.endUser.findMany({
      where: { applicationId },
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        roles: u.roleAssignments.map((ra) => ({
          id: ra.role.id,
          name: ra.role.name,
        })),
      })),
    };
  }

  async removeUser(organizationId: string, applicationId: string, userId: string) {
    await this.findOne(organizationId, applicationId);
    const user = await this.prisma.endUser.findFirst({
      where: { id: userId, applicationId },
    });

    if (!user) {
      throw new NotFoundException('User not found in this application');
    }

    await this.prisma.endUser.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  async findOne(organizationId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, organizationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateApplicationDto,
    actorId?: string,
  ) {
    const application = await this.findOne(organizationId, id);

    const updated = await this.prisma.application.update({
      where: { id },
      data: dto,
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'application.updated',
      resourceType: 'Application',
      resourceId: id,
      oldValue: {
        name: application.name,
        description: application.description,
      },
      newValue: dto,
    });

    return updated;
  }

  async remove(organizationId: string, id: string, actorId?: string) {
    const application = await this.findOne(organizationId, id);

    const deleted = await this.prisma.application.delete({
      where: { id },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'application.deleted',
      resourceType: 'Application',
      resourceId: id,
      oldValue: { name: application.name, slug: application.slug },
    });

    return deleted;
  }
}
