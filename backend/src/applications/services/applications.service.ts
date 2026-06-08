import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async create(organizationId: string, dto: CreateApplicationDto, actorId?: string) {
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
      throw new ConflictException(`Application with slug ${slug} already exists in this organization`);
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

  async findOne(organizationId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, organizationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async update(organizationId: string, id: string, dto: UpdateApplicationDto, actorId?: string) {
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
      oldValue: { name: application.name, description: application.description },
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
