import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

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

@ApiTags('Management Dashboard')
@ApiBearerAuth('Member-JWT')
@Controller('organizations')
@ApiParam({ name: 'orgId', description: 'Organization ID' })
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @ApiOperation({ summary: 'List My Organizations' })
  @UseGuards(JwtAuthGuard)
  @Get()
  getOrganizations(@Req() req: RequestWithAuth) {
    return this.organizationsService.getOrganizations(req.user.sub);
  }

  @ApiOperation({ summary: 'Update Organization' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('organization.updated')
  @Patch(':orgId')
  updateOrganization(
    @Param('orgId') organizationId: string,
    @Body() dto: { name?: string },
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.update(organizationId, dto, req.user.sub);
  }

  @ApiOperation({ summary: 'Delete Organization' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('organization.deleted')
  @Delete(':orgId')
  removeOrganization(
    @Param('orgId') organizationId: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.remove(organizationId, req.user.sub);
  }

  @ApiOperation({ summary: 'Invite Member' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.invited')
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

  @ApiOperation({ summary: 'List Organization Members' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.invited')
  @Get(':orgId/members')
  listMembers(@Param('orgId') organizationId: string) {
    return this.organizationsService.listMembers(organizationId);
  }

  @ApiOperation({ summary: 'Get Membership Details' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.invited')
  @Get(':orgId/members/:membershipId')
  @ApiParam({ name: 'membershipId', description: 'Membership ID' })
  getMemberDetails(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.organizationsService.getMemberDetails(
      organizationId,
      membershipId,
    );
  }

  @ApiOperation({ summary: 'Update Membership Status' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.suspended')
  @Patch(':orgId/members/:membershipId')
  @ApiParam({ name: 'membershipId', description: 'Membership ID' })
  updateMemberStatus(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMembershipStatusDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.updateMemberStatus(
      organizationId,
      membershipId,
      dto,
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Remove Member' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('member.removed')
  @Delete(':orgId/members/:membershipId')
  @ApiParam({ name: 'membershipId', description: 'Membership ID' })
  removeMember(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.removeMember(
      organizationId,
      membershipId,
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Assign Role to Membership' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('role.assigned')
  @Post(':orgId/memberships/:membershipId/roles')
  @ApiParam({ name: 'membershipId', description: 'Membership ID' })
  assignRole(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: AssignRoleDto,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.assignRole(
      organizationId,
      membershipId,
      dto.roleId,
      req.user.sub,
    );
  }

  @ApiOperation({ summary: 'Remove Role from Membership' })
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('role.assigned')
  @Delete(':orgId/memberships/:membershipId/roles/:roleId')
  @ApiParam({ name: 'membershipId', description: 'Membership ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  removeRole(
    @Param('orgId') organizationId: string,
    @Param('membershipId') membershipId: string,
    @Param('roleId') roleId: string,
    @Req() req: RequestWithAuth,
  ) {
    return this.organizationsService.removeRole(
      organizationId,
      membershipId,
      roleId,
      req.user.sub,
    );
  }
}
