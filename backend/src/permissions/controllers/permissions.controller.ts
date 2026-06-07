import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from '../permissions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@Controller()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'List All Available Permissions' })
  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiOperation({ summary: 'List Organization Permissions' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('permission.read')
  @Get('organizations/:orgId/permissions')
  findByOrganization(@Param('orgId') orgId: string, @Req() req: RequestWithAuth) {
    return this.permissionsService.findByOrganization(orgId, req.user.sub);
  }
}
