import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async acceptInvitation(memberId: string, dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
      select: {
        id: true,
        email: true,
        organizationId: true,
        roleId: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt <= new Date()) {
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

    const existingMembership = await this.prisma.membership.findUnique({
      where: {
        memberId_organizationId: {
          memberId,
          organizationId: invitation.organizationId,
        }
      }
    });

    if (existingMembership) {
      await this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'REVOKED' }
      });

      throw new ConflictException({
        statusCode: 409,
        error: 'ALREADY_MEMBER',
        message: 'Member is already part of this organization',
      });
    }

    const [membership] = await this.prisma.$transaction([
      this.prisma.membership.create({
        data: {
          memberId,
          organizationId: invitation.organizationId,
          roles: {
            create: {
              roleId: invitation.roleId,
            }
          }
        }
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        }
      })
    ]);

    return {
      success: true,
      statusCode: 200,
      message: 'Invitation accepted successfully',
      data: membership,
    };
  }

  async listPending(organizationId: string) {
    return this.prisma.invitation.findMany({
      where: {
        organizationId,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    });
  }

  async revokeInvitation(organizationId: string, id: string, actorId?: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, organizationId }
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException('Invitation not found or not pending');
    }

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: { status: 'REVOKED' }
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        actorId,
        action: 'invitation.revoked',
        resourceType: 'Invitation',
        resourceId: id,
        oldValue: { status: 'PENDING' } as any,
        newValue: { status: 'REVOKED' } as any,
      }
    });

    return updated;
  }
}
