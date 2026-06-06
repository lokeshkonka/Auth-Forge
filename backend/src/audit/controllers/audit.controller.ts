import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('organizations/:orgId/audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit.read')
  async getAuditLogs(
    @Param('orgId') orgId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.auditService.findByOrganization(
      orgId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }
}
