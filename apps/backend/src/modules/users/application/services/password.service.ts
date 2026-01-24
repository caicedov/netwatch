import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * Password Service
 *
 * Handles password hashing and verification using bcryptjs.
 * Enforces minimum password length and consistent hashing parameters.
 */
@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;
  private readonly minPasswordLength = 8;

  /**
   * Hash a plaintext password using bcryptjs.
   *
   * @param plainPassword - The plaintext password to hash
   * @returns Promise with the hashed password
   * @throws BadRequestException if password is too short
   */
  async hashPassword(plainPassword: string): Promise<string> {
    if (plainPassword.length < this.minPasswordLength) {
      throw new BadRequestException(
        `Password must be at least ${this.minPasswordLength} characters`,
      );
    }
    return await bcrypt.hash(plainPassword, this.saltRounds);
  }

  /**
   * Verify a plaintext password against a hash.
   *
   * @param plainPassword - The plaintext password to verify
   * @param hash - The hashed password to compare against
   * @returns Promise<boolean> true if password matches, false otherwise
   */
  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }
}
