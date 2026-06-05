import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PermissionsService } from '../permissions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  findAll() {
    return this.permissionsService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('permission.read')
  @Get('organizations/:orgId/permissions')
  findByOrganization(@Param('orgId') orgId: string) {
    return this.permissionsService.findByOrganization(orgId);
  }
}
