import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: 'My App' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'my-app', description: 'Unique slug for the application (lowercase, numbers, hyphens)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'A production application' })
  @IsString()
  @IsOptional()
  description?: string;
}
