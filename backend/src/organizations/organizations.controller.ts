import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

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

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.invite')
  @Post(':orgId/invitations')
  inviteMember(
    @Param('orgId') organizationId: string,
    @Req() req: RequestWithAuth,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(
      organizationId,
      req.user.sub,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.read')
  @Get(':orgId/members')
  listMembers(@Param('orgId') organizationId: string) {
    return this.organizationsService.listMembers(organizationId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.read')
  @Get(':orgId/members/:membershipId')
  getMemberDetails(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.organizationsService.getMemberDetails(organizationId, membershipId);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.update')
  @Patch(':orgId/members/:membershipId')
  updateMemberStatus(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMembershipStatusDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.updateMemberStatus(organizationId, membershipId, dto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.delete')
  @Delete(':orgId/members/:membershipId')
  removeMember(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.removeMember(organizationId, membershipId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('role.assign')
  @Post(':orgId/memberships/:membershipId/roles')
  assignRole(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: AssignRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.assignRole(organizationId, membershipId, dto.roleId, req.user.sub);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('role.assign')
  @Delete(':orgId/memberships/:membershipId/roles/:roleId')
  removeRole(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Param('roleId') roleId: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.removeRole(organizationId, membershipId, roleId, req.user.sub);
  }
}
