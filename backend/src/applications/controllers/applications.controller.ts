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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('organizations/:orgId/applications')
@ApiParam({ name: 'orgId', description: 'Organization ID' })
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @ApiOperation({ summary: 'Create Application' })
  @Post()
  @RequirePermissions('application.handle')
  create(
    @Param('orgId') organizationId: string,
    @Body() createApplicationDto: CreateApplicationDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.applicationsService.create(
      organizationId,
      createApplicationDto,
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'List Applications' })
  @Get()
  @RequirePermissions('application.view')
  findAll(@Param('orgId') organizationId: string) {
    return this.applicationsService.findAll(organizationId);
  }

  @ApiOperation({ summary: 'Get Application Details' })
  @Get(':appId')
  @ApiParam({ name: 'appId', description: 'Application ID' })
  @RequirePermissions('application.view')
  findOne(@Param('orgId') organizationId: string, @Param('appId') appId: string) {
    return this.applicationsService.findOne(organizationId, appId);
  }

  @ApiOperation({ summary: 'Update Application' })
  @Patch(':appId')
  @ApiParam({ name: 'appId', description: 'Application ID' })
  @RequirePermissions('application.handle')
  update(
    @Param('orgId') organizationId: string,
    @Param('appId') appId: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.applicationsService.update(
      organizationId,
      appId,
      updateApplicationDto,
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Delete Application' })
  @Delete(':appId')
  @ApiParam({ name: 'appId', description: 'Application ID' })
  @RequirePermissions('application.handle')
  async remove(

    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Req() req: RequestWithAuth,
  ) {
    const application = await this.applicationsService.remove(
      orgId,
      appId,
      req.user.sub,
    );
    return {
      success: true,
      application,
    };
  }
}
