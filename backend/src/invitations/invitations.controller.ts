import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
