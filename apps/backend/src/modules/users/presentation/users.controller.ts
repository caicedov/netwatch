import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from '../application/services/auth.service';
import {
  CreateUserDto,
  LoginDto,
  RefreshTokenDto,
  UserDto,
  AuthResponseDto,
} from '../application/dtos';
import { User } from '@netwatch/domain';

/**
 * Users Controller
 *
 * Handles authentication endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/refresh
 *
 * Delegates to AuthService for business logic.
 */
@Controller('auth')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register new user.
   *
   * @param createUserDto - Registration payload (username, password, email)
   * @returns UserDto with userId, username, email, timestamps
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async register(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.authService.register(
      createUserDto.username,
      createUserDto.password,
      createUserDto.email,
    );

    return this.userToDto(user);
  }

  /**
   * Login with username and password.
   *
   * @param loginDto - Login payload (username, password)
   * @returns AuthResponseDto with accessToken, refreshToken, user info
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto.username,
      loginDto.password,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token.
   *
   * @param refreshTokenDto - Refresh token
   * @returns AuthResponseDto with new accessToken
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(ValidationPipe)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { accessToken } = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );

    return { accessToken };
  }

  /**
   * Convert User domain entity to DTO.
   */
  private userToDto(user: User): UserDto {
    return {
      userId: user.getId(),
      username: user.getUsername(),
      email: user.getEmail() || '',
      createdAt: user.getCreatedAt(),
      lastLoginAt: user.getLastLoginAt(),
      isActive: user.getIsActive(),
    };
  }
}
