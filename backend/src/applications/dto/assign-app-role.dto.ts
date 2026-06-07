import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignAppRoleDto {
  @ApiProperty({ example: 'uuid-of-role', description: 'The ID of the application role to assign' })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
