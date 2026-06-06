import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AppPermissionsService } from '../services/app-permissions.service';
import { CreateAppPermissionDto } from '../dto/app-permission.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('organizations/:orgId/applications/:appId/permissions')
export class AppPermissionsController {
  constructor(private readonly appPermissionsService: AppPermissionsService) {}

  @Post()
  @RequirePermissions('app_permission.create')
  create(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Body() dto: CreateAppPermissionDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appPermissionsService.create(appId, dto, orgId, req.user.sub);
  }

  @Get()
  @RequirePermissions('app_permission.read')
  findAll(@Param('appId') appId: string) {
    return this.appPermissionsService.findAll(appId);
  }

  @Delete(':id')
  @RequirePermissions('app_permission.delete')
  remove(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.appPermissionsService.remove(appId, id, orgId, req.user.sub);
  }
}
