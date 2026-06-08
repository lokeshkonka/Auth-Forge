import {
  Controller,
  Get,
  Post,
  Body,
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

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('organizations/:orgId/applications/:appId/api-keys')
@ApiParam({ name: 'orgId', description: 'Organization ID' })
@ApiParam({ name: 'appId', description: 'Application ID' })
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @ApiOperation({ summary: 'Create API Key' })
  @Post()
  @RequirePermissions('apikey.handle')
  create(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Body() dto: CreateApiKeyDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.apiKeysService.create(orgId, appId, dto, req.user.sub);
  }

  @ApiOperation({ summary: 'List API Keys' })
  @Get()
  @RequirePermissions('apikey.handle')
  findAll(@Param('orgId') orgId: string, @Param('appId') appId: string) {
    return this.apiKeysService.findAll(orgId, appId);
  }

  @ApiOperation({ summary: 'Remove API Key' })
  @Delete(':id')
  @ApiParam({ name: 'id', description: 'API Key ID' })
  @RequirePermissions('apikey.handle')
  remove(
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.apiKeysService.remove(orgId, appId, id, req.user.sub);
  }
}
