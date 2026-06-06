import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AppRolesService } from '../services/app-roles.service';
import { CreateAppRoleDto, UpdateAppRoleDto } from '../dto/app-role.dto';
import { AssignAppRoleDto } from '../dto/assign-app-role.dto';
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
@Controller('organizations/:orgId/applications/:appId/roles')
export class AppRolesController {
  constructor(private readonly appRolesService: AppRolesService) {}

  @Post()
  @RequirePermissions('app_role.create')
  create(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Body() dto: CreateAppRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.create(appId, dto, orgId, req.user.sub);
  }

  @Get()
  @RequirePermissions('app_role.read')
  findAll(@Param('appId') appId: string) {
    return this.appRolesService.findAll(appId);
  }

  @Get(':id')
  @RequirePermissions('app_role.read')
  findOne(@Param('appId') appId: string, @Param('id') id: string) {
    return this.appRolesService.findOne(appId, id);
  }

  @Patch(':id')
  @RequirePermissions('app_role.update')
  update(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.update(appId, id, dto, orgId, req.user.sub);
  }

  @Delete(':id')
  @RequirePermissions('app_role.delete')
  remove(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.remove(appId, id, orgId, req.user.sub);
  }

  @Post('assignments/:userId')
  @RequirePermissions('app_role.assign')
  assignToUser(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignAppRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.assignToUser(appId, userId, dto.roleId, orgId, req.user.sub);
  }

  @Delete('assignments/:userId/:roleId')
  @RequirePermissions('app_role.assign')
  unassignFromUser(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.unassignFromUser(appId, userId, roleId, orgId, req.user.sub);
  }
}
