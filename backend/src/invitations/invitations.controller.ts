import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Param,
  Delete,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationsService } from './invitations.service';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @ApiOperation({ summary: 'Accept Invitation' })
  @UseGuards(JwtAuthGuard)
  @Post('accept')
  acceptInvitation(
    @Req() req: RequestWithAuth,
    @Body() dto: AcceptInvitationDto,
  ) {
    return this.invitationsService.acceptInvitation(req.user.sub, dto);
  }
}

// Additional controller to handle organization scoped invitation endpoints
@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@Controller('organizations/:organizationId/invitations')
export class OrganizationInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @ApiOperation({ summary: 'List Pending Invitations' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.invited')
  @Get()
  listPending(@Param('organizationId') organizationId: string) {
    return this.invitationsService.listPending(organizationId);
  }

  @ApiOperation({ summary: 'Revoke Invitation' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.removed')
  @Delete(':id')
  revokeInvitation(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.invitationsService.revokeInvitation(
      organizationId,
      id,
      req.user.sub,
    );
  }
}
