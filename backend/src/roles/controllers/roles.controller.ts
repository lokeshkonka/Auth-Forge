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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from '../roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
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
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('organizations/:orgId/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Create Role' })
  @Post()
  @RequirePermissions('role.created')
  create(
    @Param('orgId') orgId: string,
    @Body() createRoleDto: CreateRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.rolesService.create(orgId, createRoleDto, req.user.sub);
  }

  @ApiOperation({ summary: 'List All Roles' })
  @Get()
  @RequirePermissions('role.created')
  findAll(@Param('orgId') orgId: string) {
    return this.rolesService.findAll(orgId);
  }

  @ApiOperation({ summary: 'Get Role Details' })
  @Get(':id')
  @RequirePermissions('role.created')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.rolesService.findOne(orgId, id);
  }

  @ApiOperation({ summary: 'Update Role' })
  @Patch(':id')
  @RequirePermissions('role.updated')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.rolesService.update(orgId, id, updateRoleDto, req.user.sub);
  }

  @ApiOperation({ summary: 'Remove Role' })
  @Delete(':id')
  @RequirePermissions('role.deleted')
  remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.rolesService.remove(orgId, id, req.user.sub);
  }
}
