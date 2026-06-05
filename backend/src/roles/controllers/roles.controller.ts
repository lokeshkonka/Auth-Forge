import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { RolesService } from '../roles.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@UseGuards(JwtAuthGuard)
@Controller('organizations/:orgId/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Param('orgId') orgId: string, @Body() createRoleDto: CreateRoleDto, @Req() req: RequestWithAuth) {
    return this.rolesService.create(orgId, createRoleDto, req.user.sub);
  }

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.rolesService.findAll(orgId);
  }

  @Get(':id')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.rolesService.findOne(orgId, id);
  }

  @Patch(':id')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.rolesService.update(orgId, id, updateRoleDto, req.user.sub);
  }

  @Delete(':id')
  remove(@Param('orgId') orgId: string, @Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.rolesService.remove(orgId, id, req.user.sub);
  }
}
