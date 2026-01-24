/**
 * User Response DTO
 *
 * Public representation of a user (no sensitive data).
 */
export class UserDto {
  userId!: string;
  username!: string;
  email!: string;
  createdAt!: Date;
  lastLoginAt!: Date | null;
  isActive!: boolean;
}
