import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AppRolesService } from '../services/app-roles.service';
import { CreateAppRoleDto, UpdateAppRoleDto } from '../dto/app-role.dto';
import { AssignAppRoleDto } from '../dto/assign-app-role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('organizations/:orgId/applications/:appId/roles')
@ApiParam({ name: 'orgId', description: 'Organization ID' })
@ApiParam({ name: 'appId', description: 'Application ID' })
export class AppRolesController {
  constructor(private readonly appRolesService: AppRolesService) {}

  @ApiOperation({ summary: 'Create Application Role' })
  @Post()
  @RequirePermissions('app_role.created')
  create(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Body() dto: CreateAppRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.create(appId, dto, orgId, req.user.sub);
  }

  @ApiOperation({ summary: 'List Application Roles' })
  @Get()
  @RequirePermissions('app_role.created')
  findAll(@Param('appId') appId: string) {
    return this.appRolesService.findAll(appId);
  }

  @ApiOperation({ summary: 'Get Application Role Details' })
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Role ID' })
  @RequirePermissions('app_role.created')
  findOne(@Param('appId') appId: string, @Param('id') id: string) {
    return this.appRolesService.findOne(appId, id);
  }

  @ApiOperation({ summary: 'Update Application Role' })
  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Role ID' })
  @RequirePermissions('app_role.updated')
  update(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.update(appId, id, dto, orgId, req.user.sub);
  }

  @ApiOperation({ summary: 'Delete Application Role' })
  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Role ID' })
  @RequirePermissions('app_role.deleted')
  remove(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.remove(appId, id, orgId, req.user.sub);
  }

  @ApiOperation({ summary: 'Assign Application Role to User' })
  @Post('assignments/:userId')
  @ApiParam({ name: 'userId', description: 'End-User ID' })
  @RequirePermissions('app_role.assigned')
  assignToUser(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignAppRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appRolesService.assignToUser(appId, userId, dto.roleId, orgId, req.user.sub);
  }

  @ApiOperation({ summary: 'Unassign Application Role from User' })
  @Delete('assignments/:userId/:roleId')
  @ApiParam({ name: 'userId', description: 'End-User ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @RequirePermissions('app_role.unassigned')
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
