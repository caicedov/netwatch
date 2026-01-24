import { IsString } from 'class-validator';

/**
 * Login DTO
 *
 * Validation rules for user login.
 */
export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}
