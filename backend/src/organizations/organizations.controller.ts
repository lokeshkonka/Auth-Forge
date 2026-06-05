import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';

import { InviteMemberDto } from './dto/invite-member.dto';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type RequestWithAuth = {
  user: {
    sub: string;
    sessionId: string;
  };
};

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getOrganizations(@Req() req: RequestWithAuth) {
    return this.organizationsService.getOrganizations(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/invitations')
  inviteMember(
    @Param('id') organizationId: string,
    @Req() req: RequestWithAuth,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(
      organizationId,
      req.user.sub,
      dto,
    );
  }
}
