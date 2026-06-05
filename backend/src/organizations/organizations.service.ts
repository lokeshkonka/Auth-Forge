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

    if (organization.ownerId !== inviterMemberId) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'NOT_ORGANIZATION_OWNER',
        message: 'Only the organization owner can invite members',
      });
    }

    const existingMembership =
      await this.membersService.findMembershipByMemberAndOrganization(
        inviterMemberId,
        organizationId,
      );

    if (!existingMembership) {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'NOT_A_MEMBER',
        message: 'You must belong to the organization to invite members',
      });
    }

    const duplicateMembership = await this.prisma.member.findFirst({
      where: {
        email,
        memberships: {
          some: {
            organizationId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateMembership) {
      throw new ConflictException({
        statusCode: 409,
        error: 'MEMBER_ALREADY_IN_ORGANIZATION',
        message: 'Member is already part of this organization',
      });
    }

    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email,
        token: randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      success: true,
      statusCode: 201,
      message: 'Invitation created successfully',
      data: invitation,
    };
  }
}
