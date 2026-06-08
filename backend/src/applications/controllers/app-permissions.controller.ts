import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AppPermissionsService } from '../services/app-permissions.service';
import {
  CreateAppPermissionDto,
  UpdateAppPermissionDto,
} from '../dto/app-permission.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('organizations/:orgId/applications/:appId/permissions')
@ApiParam({ name: 'orgId', description: 'Organization ID' })
@ApiParam({ name: 'appId', description: 'Application ID' })
export class AppPermissionsController {
  constructor(private readonly appPermissionsService: AppPermissionsService) {}

  @ApiOperation({ summary: 'Create Application Permission' })
  @Post()
  @RequirePermissions('app_permission.handle')
  create(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Body() dto: CreateAppPermissionDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appPermissionsService.create(appId, dto, orgId, req.user.sub);
  }

  @ApiOperation({ summary: 'List Application Permissions' })
  @Get()
  @RequirePermissions('app_permission.handle')
  findAll(@Param('appId') appId: string) {
    return this.appPermissionsService.findAll(appId);
  }

  @ApiOperation({ summary: 'Update Application Permission' })
  @Patch(':id')
  @RequirePermissions('app_permission.handle')
  update(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAppPermissionDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.appPermissionsService.update(appId, id, dto, orgId, req.user.sub);
  }

  @ApiOperation({ summary: 'Delete Application Permission' })
  @Delete(':id')
  @RequirePermissions('app_permission.handle')
  remove(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.appPermissionsService.remove(appId, id, orgId, req.user.sub);
  }
}
