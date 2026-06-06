import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppPermissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
