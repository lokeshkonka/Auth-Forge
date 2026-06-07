import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditStatus } from '@prisma/client';

export interface AuditLogOptions {
  organizationId: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  status?: AuditStatus;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private filterSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveKeys = ['password', 'passwordHash', 'jwt', 'token', 'refreshToken', 'accessToken', 'apiKey', 'secretKey', 'keyHash', 'secretKeyHash'];
    const filtered = { ...data };

    for (const key of Object.keys(filtered)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        filtered[key] = '[REDACTED]';
      } else if (typeof filtered[key] === 'object') {
        filtered[key] = this.filterSensitiveData(filtered[key]);
      }
    }

    return filtered;
  }

  async createLog(options: AuditLogOptions) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: options.organizationId,
        actorId: options.actorId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        oldValue: this.filterSensitiveData(options.oldValue),
        newValue: this.filterSensitiveData(options.newValue),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        status: options.status ?? AuditStatus.SUCCESS,
        errorMessage: options.errorMessage,
      },
    });
  }

  async findByOrganization(organizationId: string, limit = 50, offset = 0) {
    const safeLimit = Math.min(limit, 100);
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      include: {
        organization: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      skip: offset,
    });
  }
}
