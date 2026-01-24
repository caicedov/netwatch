/**
 * Auth Response DTO
 *
 * Returned after successful login or token refresh.
 */
export class AuthResponseDto {
  accessToken!: string;
  refreshToken?: string; // Only returned on login, not refresh
  user?: {
    userId: string;
    username: string;
    email: string;
  };
}
