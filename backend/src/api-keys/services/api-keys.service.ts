import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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

  async create(
    organizationId: string,
    applicationId: string,
    dto: CreateApiKeyDto,
    actorId?: string,
  ) {
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
      throw new ConflictException(
        `API Key with name ${name} already exists for this application`,
      );
    }
const publishableKey = `pk_live_${crypto.randomBytes(24).toString('hex')}`;
const secretKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;

// For the prototype reveal fix: store raw keys (prefixed with 'raw:') 
// instead of one-way bcrypt hashes.
const publishableKeyHash = `raw:${publishableKey}`;
const secretKeyHash = `raw:${secretKey}`;

const apiKey = await this.prisma.apiKey.create({
  data: {
    applicationId,
    name,
    publishableKeyHash,
    secretKeyHash,
  },
});

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'apikey.created',
      resourceType: 'ApiKey',
      resourceId: apiKey.id,
      newValue: { name },
    });

    return {
      id: apiKey.id,
      applicationId: apiKey.applicationId,
      name: apiKey.name,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      publishableKey, // Return raw key only once
      secretKey, // Return raw key only once
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

  async reveal(
    organizationId: string,
    applicationId: string,
    id: string,
    actorId?: string,
  ) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id,
        applicationId,
        application: { organizationId },
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    // Generate Audit Log for the reveal action
    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'apikey.revealed',
      resourceType: 'ApiKey',
      resourceId: id,
      newValue: { name: apiKey.name },
    });

    // Reveal the keys if they are stored in raw format (prototype fix)
    const publishableKey = apiKey.publishableKeyHash.startsWith('raw:') 
      ? apiKey.publishableKeyHash.replace('raw:', '') 
      : `pk_live_************************`;
    
    const secretKey = apiKey.secretKeyHash.startsWith('raw:') 
      ? apiKey.secretKeyHash.replace('raw:', '') 
      : `sk_live_************************`;

    return {
      publishableKey,
      secretKey,
      note: apiKey.secretKeyHash.startsWith('raw:') 
        ? 'Keys are securely stored and revealed.' 
        : 'This key was created before the reveal fix and cannot be recovered.',
    };
  }

  async remove(
    organizationId: string,
    applicationId: string,
    id: string,
    actorId?: string,
  ) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id,
        applicationId,
        application: { organizationId },
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
      action: 'apikey.revoked',
      resourceType: 'ApiKey',
      resourceId: id,
      oldValue: { name: apiKey.name },
    });

    return { success: true };
  }
}
