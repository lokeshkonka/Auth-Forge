import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../database/prisma.service';
import { SignupDto } from '../dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const slug = dto.organizationSlug.trim().toLowerCase();

    const existingMember = await this.prisma.member.findUnique({
      where: {
        email,
      },
    });

    if (existingMember) {
      throw new ConflictException({
        statusCode: 409,
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists',
      });
    }

    const existingOrganization =
      await this.prisma.organization.findUnique({
        where: {
          slug,
        },
      });

    if (existingOrganization) {
      throw new ConflictException({
        statusCode: 409,
        error: 'ORGANIZATION_SLUG_ALREADY_EXISTS',
        message: 'Organization slug is already taken',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: dto.organizationName.trim(),
            slug,
          },
        });

        const member = await tx.member.create({
          data: {
            email,
            passwordHash,
            firstName: dto.firstName?.trim(),
            lastName: dto.lastName?.trim(),
            organizationId: organization.id,
          },
        });

        await tx.organization.update({
          where: {
            id: organization.id,
          },
          data: {
            ownerId: member.id,
          },
        });

        return {
          organization,
          member,
        };
      });

      return {
        success: true,
        statusCode: 201,
        message: 'Organization created successfully',
        data: {
          organizationId: result.organization.id,
          memberId: result.member.id,
        },
      };
    } catch {
      throw new InternalServerErrorException({
        statusCode: 500,
        error: 'SIGNUP_FAILED',
        message: 'Unable to create organization account',
      });
    }
  }
}