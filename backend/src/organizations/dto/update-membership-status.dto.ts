import { IsEnum } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class UpdateMembershipStatusDto {
  @IsEnum(MembershipStatus)
  status: MembershipStatus;
}
