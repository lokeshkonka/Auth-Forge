import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppPermissionDto {
  @ApiProperty({
    example: 'user.create',
    description: 'Unique key for the application permission',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    example: 'Create Users',
    description: 'Display name for the permission',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Allows creating new users in the app',
    description: 'Detailed description of the permission',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAppPermissionDto {
  @ApiPropertyOptional({ example: 'user.create.v2' })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiPropertyOptional({ example: 'Create Users New' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}
