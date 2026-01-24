import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@netwatch/domain';
import { UserRepository } from '../../infrastructure/persistence/user.repository';
import { PasswordService } from './password.service';
import { v4 as uuid } from 'uuid';

/**
 * Auth Service
 *
 * Handles user registration, login, and JWT token management.
 * Enforces server-authoritative authentication and password security.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user.
   *
   * @param username - Username (3-20 characters enforced by domain)
   * @param password - Plaintext password (minimum 8 characters)
   * @param email - Email address
   * @returns Promise<User> the created user
   * @throws ConflictException if username or email already exists
   */
  async register(username: string, password: string, email: string): Promise<User> {
    // Verify username not already taken
    const existingByUsername = await this.userRepository.findByUsername(username);
    if (existingByUsername) {
      throw new ConflictException('Username already taken');
    }

    // Verify email not already taken
    const existingByEmail = await this.userRepository.findByEmail(email);
    if (existingByEmail) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(password);

    // Create user aggregate (domain invariants enforced here)
    const user = User.create(username, passwordHash, email);

    // Persist to database
    return await this.userRepository.create(user);
  }

  /**
   * Authenticate user and issue JWT tokens.
   *
   * @param username - Username
   * @param password - Plaintext password
   * @returns Promise with accessToken and refreshToken
   * @throws UnauthorizedException if credentials invalid
   */
  async login(
    username: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Load user by username
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const passwordMatch = await this.passwordService.verifyPassword(
      password,
      user.getPasswordHash(),
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Record login time (update domain aggregate)
    user.recordLogin();
    await this.userRepository.update(user);

    // Generate tokens
    const payload = { sub: user.getId(), username: user.getUsername() };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using refresh token.
   *
   * @param refreshToken - The refresh token issued at login
   * @returns Promise with new accessToken
   * @throws UnauthorizedException if refresh token invalid or user not found
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Verify user still exists and is active
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.getIsActive()) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Issue new access token
      const newPayload = { sub: user.getId(), username: user.getUsername() };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
