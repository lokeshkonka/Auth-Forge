import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@Controller('organizations/:orgId/audit-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiParam({ name: 'orgId', description: 'Organization ID' })
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'List Audit Logs' })
  @Get()
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
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
