import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApplicationsService } from '../services/applications.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationDto } from '../dto/update-application.dto';
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
@Controller('organizations/:orgId/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @RequirePermissions('application.create')
  create(
    @Param('orgId') orgId: string,
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.applicationsService.create(orgId, createApplicationDto, req.user.sub);
  }

  @Get()
  @RequirePermissions('application.read')
  findAll(@Param('orgId') orgId: string) {
    return this.applicationsService.findAll(orgId);
  }

  @Get(':id')
  @RequirePermissions('application.read')
  findOne(@Param('orgId') orgId: string, @Param('id') id: string) {
    return this.applicationsService.findOne(orgId, id);
  }

  @Patch(':id')
  @RequirePermissions('application.update')
  update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.applicationsService.update(orgId, id, updateApplicationDto, req.user.sub);
  }

  @Delete(':id')
  @RequirePermissions('application.delete')
  remove(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.applicationsService.remove(orgId, id, req.user.sub);
  }
}
