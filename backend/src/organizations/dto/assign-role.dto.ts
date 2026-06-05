import { IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsUUID('4')
  roleId: string;
}
