import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiKeysService } from '../services/api-keys.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
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
@Controller('organizations/:orgId/applications/:appId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @RequirePermissions('apikey.create')
  create(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Body() dto: CreateApiKeyDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.apiKeysService.create(orgId, appId, dto, req.user.sub);
  }

  @Get()
  @RequirePermissions('apikey.read')
  findAll(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
  ) {
    return this.apiKeysService.findAll(orgId, appId);
  }

  @Delete(':id')
  @RequirePermissions('apikey.delete')
  remove(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.apiKeysService.remove(orgId, appId, id, req.user.sub);
  }
}
