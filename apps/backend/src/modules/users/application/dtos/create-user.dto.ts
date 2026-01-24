import { IsString, Length, IsEmail, MinLength } from 'class-validator';

/**
 * Create User DTO
 *
 * Validation rules for user registration.
 * - Username: 3-20 characters (domain invariant)
 * - Email: Valid email format
 * - Password: At least 8 characters
 */
export class CreateUserDto {
  @IsString()
  @Length(3, 20, {
    message: 'Username must be between 3 and 20 characters',
  })
  username!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters',
  })
  password!: string;
}
