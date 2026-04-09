import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken?: string;
}
