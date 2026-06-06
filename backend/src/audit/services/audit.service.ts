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

  async createLog(options: AuditLogOptions) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: options.organizationId,
        actorId: options.actorId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        oldValue: options.oldValue,
        newValue: options.newValue,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        status: options.status ?? AuditStatus.SUCCESS,
        errorMessage: options.errorMessage,
      },
    });
  }

  async findByOrganization(organizationId: string, limit = 50, offset = 0) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
