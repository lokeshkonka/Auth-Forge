import { IsNotEmpty, IsString } from 'class-validator';

export class AssignAppRoleDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
