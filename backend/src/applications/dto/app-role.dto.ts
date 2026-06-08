import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppRoleDto {
  @ApiProperty({
    example: 'Banker',
    description: 'The name of the application role',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Access to financial records',
    description: 'A brief description of the role',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAppRoleDto {
  @ApiPropertyOptional({ example: 'Senior Banker' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Extended access to records' })
  @IsString()
  @IsOptional()
  description?: string;
}
