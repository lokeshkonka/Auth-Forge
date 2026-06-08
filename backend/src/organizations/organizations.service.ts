import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../database/prisma.service';
import { MembersService } from '../members/members.service';
import { AuditService } from '../audit/services/audit.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
    private readonly auditService: AuditService,
  ) {}

  getOrganizations(memberId: string) {
    return this.membersService.findMembershipsByMemberId(memberId);
  }

  async update(
    organizationId: string,
    dto: { name?: string },
    actorId?: string,
  ) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: dto,
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'organization.updated',
      resourceType: 'Organization',
      resourceId: organizationId,
      oldValue: { name: organization.name },
      newValue: dto,
    });

    return updated;
  }

  async remove(organizationId: string, actorId?: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const deleted = await this.prisma.organization.delete({
      where: { id: organizationId },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'organization.deleted',
      resourceType: 'Organization',
      resourceId: organizationId,
      oldValue: { name: organization.name, slug: organization.slug },
    });

    return deleted;
  }

  async inviteMember(
    organizationId: string,
    inviterMemberId: string,
    dto: InviteMemberDto,
  ) {
    const email = dto.email.trim().toLowerCase();

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        ownerId: true,
        name: true,
        slug: true,
      },
    });

    if (!organization) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      });
    }

    // 1. Check if the role belongs to this organization
    const role = await this.prisma.role.findFirst({
      where: { id: dto.roleId, organizationId },
    });

    if (!role) {
      throw new BadRequestException(
        'The selected role does not belong to this organization',
      );
    }

    // 2. Check if the user is already a member
    const existingMember = await this.prisma.membership.findFirst({
      where: {
        organizationId,
        member: { email },
      },
    });

    if (existingMember) {
      throw new ConflictException(
        'This user is already a member of the organization',
      );
    }

    // 3. Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        organizationId,
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email,
        roleId: dto.roleId,
        invitedById: inviterMemberId,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Generate Audit Log
    await this.auditService.createLog({
      organizationId,
      actorId: inviterMemberId,
      action: 'member.invited',
      resourceType: 'Member',
      resourceId: invitation.id,
      newValue: { email, roleId: dto.roleId },
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Invitation created successfully',
      data: invitation,
    };
  }

  async listMembers(organizationId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Members fetched successfully',
      data: memberships.map((m) => ({
        id: m.id,
        memberId: m.memberId,
        email: m.member.email,
        firstName: m.member.firstName,
        lastName: m.member.lastName,
        status: m.status,
        isOwner: m.isOwner,
        createdAt: m.createdAt,
        roles: m.roles.map((r) => ({
          id: r.role.id,
          name: r.role.name,
          isSystemRole: r.role.isSystemRole,
        })),
      })),
    };
  }

  async getMemberDetails(organizationId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return membership;
  }

  async updateMemberStatus(
    organizationId: string,
    membershipId: string,
    dto: UpdateMembershipStatusDto,
    actorId?: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { status: dto.status },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action:
        dto.status === 'SUSPENDED'
          ? 'member.suspended'
          : 'member.status_updated',
      resourceType: 'Membership',
      resourceId: membershipId,
      oldValue: { status: membership.status },
      newValue: { status: dto.status },
    });

    return updated;
  }

  async removeMember(
    organizationId: string,
    membershipId: string,
    actorId?: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.isOwner) {
      throw new ConflictException('Cannot remove the organization owner');
    }

    const deleted = await this.prisma.membership.delete({
      where: { id: membershipId },
    });

    // Generate Audit Log
    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'member.removed',
      resourceType: 'Member',
      resourceId: membership.memberId,
      oldValue: { membershipId },
    });

    return deleted;
  }

  async assignRole(
    organizationId: string,
    membershipId: string,
    roleId: string,
    actorId?: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found in this organization');
    }

    if (role.name === 'Owner' && role.isSystemRole) {
      throw new ForbiddenException(
        'The Owner role cannot be manually assigned',
      );
    }

    const assignment = await this.prisma.memberRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId,
          roleId,
        },
      },
      update: {},
      create: {
        membershipId,
        roleId,
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'role.assigned',
      resourceType: 'Membership',
      resourceId: membershipId,
      newValue: { roleId },
    });

    return assignment;
  }

  async removeRole(
    organizationId: string,
    membershipId: string,
    roleId: string,
    actorId?: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId },
    });

    if (role && role.name === 'Owner' && role.isSystemRole) {
      throw new ForbiddenException('The Owner role cannot be manually removed');
    }

    const result = await this.prisma.memberRole.deleteMany({
      where: {
        membershipId,
        roleId,
      },
    });

    await this.auditService.createLog({
      organizationId,
      actorId,
      action: 'role.unassigned',
      resourceType: 'Membership',
      resourceId: membershipId,
      oldValue: { roleId },
    });

    return result;
  }
}
