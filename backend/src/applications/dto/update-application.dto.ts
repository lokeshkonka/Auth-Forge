import { IsOptional, IsString } from 'class-validator';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
