import { IsNotEmpty, IsString } from 'class-validator';

export class EndUserRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
