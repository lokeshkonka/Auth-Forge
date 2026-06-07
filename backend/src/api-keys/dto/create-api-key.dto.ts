import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production Key', description: 'Friendly name for the API key' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
