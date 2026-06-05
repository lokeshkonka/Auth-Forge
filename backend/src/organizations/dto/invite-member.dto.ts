import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsUUID('4')
  @IsNotEmpty()
  roleId: string;
}
