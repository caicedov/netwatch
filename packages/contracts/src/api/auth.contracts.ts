/**
 * API Contracts
 *
 * HTTP request and response DTOs.
 * Shared between backend and frontend.
 */

// Auth endpoints
export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequestDto {
  username: string;
  email?: string;
  password: string;
}

export interface RegisterResponseDto {
  id: string;
  username: string;
  email?: string;
}
