import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/services/audit.service';
import * as crypto from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(organizationId: string, applicationId: string, dto: CreateApiKeyDto, actorId?: string) {
    const { name } = dto;
    // Verify application belongs to organization
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, organizationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const existingKey = await this.prisma.apiKey.findFirst({
      where: { applicationId, name },
    });

    if (existingKey) {
      throw new ConflictException(`API Key with name \${name} already exists for this application`);
    }

    const rawKey = `ak_\${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        applicationId,
        name,
        keyHash,
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'api_key.created',
      resourceType: 'ApiKey',
      resourceId: apiKey.id,
      newValue: { name },
    });

    return {
      ...apiKey,
      rawKey, // Return raw key only once
    };
  }

  async findAll(organizationId: string, applicationId: string) {
    // Verify application belongs to organization
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, organizationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return this.prisma.apiKey.findMany({
      where: { applicationId },
      select: {
        id: true,
        applicationId: true,
        name: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async remove(organizationId: string, applicationId: string, id: string, actorId?: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { 
        id, 
        applicationId, 
        application: { organizationId } 
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    await this.prisma.apiKey.delete({
      where: { id },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'api_key.revoked',
      resourceType: 'ApiKey',
      resourceId: id,
      oldValue: { name: apiKey.name },
    });

    return { success: true };
  }
}
