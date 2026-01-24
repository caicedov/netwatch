import { IsString } from 'class-validator';

/**
 * Refresh Token DTO
 *
 * Request body for token refresh endpoint.
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}
