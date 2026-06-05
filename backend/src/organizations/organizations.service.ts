import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../database/prisma.service';
import { MembersService } from '../members/members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMembershipStatusDto } from './dto/update-membership-status.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
  ) {}

  getOrganizations(memberId: string) {
    return this.membersService.findMembershipsByMemberId(memberId);
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
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        actorId: inviterMemberId,
        action: 'member.invited',
        resourceType: 'Invitation',
        resourceId: invitation.id,
        newValue: { email, roleId: dto.roleId } as any,
      }
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Invitation created successfully',
      data: invitation,
    };
  }

  async listMembers(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        member: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
    });
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
          }
        },
        roles: {
          include: {
            role: true
          }
        }
      }
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
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId }
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { status: dto.status }
    });
  }

  async removeMember(organizationId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
      include: { organization: true }
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.organization.ownerId === membership.memberId) {
      throw new ConflictException('Cannot remove the organization owner');
    }

    const deleted = await this.prisma.membership.delete({
      where: { id: membershipId }
    });

    // Generate Audit Log
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: 'member.removed',
        resourceType: 'Member',
        resourceId: membership.memberId,
        oldValue: { membershipId } as any,
      }
    });

    return deleted;
  }

  async assignRole(organizationId: string, membershipId: string, roleId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId }
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const role = await this.prisma.role.findFirst({
      where: { id: roleId, organizationId }
    });

    if (!role) {
      throw new NotFoundException('Role not found in this organization');
    }

    return this.prisma.memberRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId,
          roleId
        }
      },
      update: {},
      create: {
        membershipId,
        roleId
      }
    });
  }

  async removeRole(organizationId: string, membershipId: string, roleId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId }
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    return this.prisma.memberRole.deleteMany({
      where: {
        membershipId,
        roleId
      }
    });
  }
}
