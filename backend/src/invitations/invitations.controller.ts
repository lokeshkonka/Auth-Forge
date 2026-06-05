import { Body, Controller, Post, Req, UseGuards, Param, Delete, Get } from '@nestjs/common';

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

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('accept')
  acceptInvitation(@Req() req: RequestWithAuth, @Body() dto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(req.user.sub, dto);
  }
}

// Additional controller to handle organization scoped invitation endpoints
@Controller('organizations/:organizationId/invitations')
export class OrganizationInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('invitation.read')
  @Get()
  listPending(@Param('organizationId') organizationId: string) {
    return this.invitationsService.listPending(organizationId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('invitation.delete')
  @Delete(':id')
  revokeInvitation(@Param('organizationId') organizationId: string, @Param('id') id: string, @Req() req: RequestWithAuth) {
    return this.invitationsService.revokeInvitation(organizationId, id, req.user.sub);
  }
}
