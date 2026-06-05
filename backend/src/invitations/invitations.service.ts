import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { MembersService } from '../members/members.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
  ) {}

  async acceptInvitation(memberId: string, dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
      select: {
        id: true,
        email: true,
        organizationId: true,
        expiresAt: true,
      },
    });

    if (!invitation || invitation.expiresAt <= new Date()) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'INVITATION_NOT_FOUND',
        message: 'Invitation not found or expired',
      });
    }

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!member || member.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVITATION_EMAIL_MISMATCH',
        message: 'Invitation does not belong to this account',
      });
    }

    const existingMembership =
      await this.membersService.findMembershipByMemberAndOrganization(
        memberId,
        invitation.organizationId,
      );

    if (existingMembership) {
      await this.prisma.invitation.delete({
        where: { id: invitation.id },
      });

      throw new ConflictException({
        statusCode: 409,
        error: 'ALREADY_MEMBER',
        message: 'Member is already part of this organization',
      });
    }

    const membership = await this.membersService.createMembership(
      memberId,
      invitation.organizationId,
    );

    await this.prisma.invitation.delete({
      where: { id: invitation.id },
    });

    return {
      success: true,
      statusCode: 200,
      message: 'Invitation accepted successfully',
      data: membership,
    };
  }
}
