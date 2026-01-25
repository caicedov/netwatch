/**
 * User Mapper
 *
 * Maps between Prisma User model and domain User entity.
 * Enforces domain invariants during reconstruction.
 */
import { User } from '@netwatch/domain';
import type { User as PrismaUser } from '@prisma/client';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.fromPersistence(
      raw.id,
      raw.username,
      raw.passwordHash,
      raw.email,
      raw.createdAt,
      raw.lastLoginAt,
      raw.isActive,
    );
  }

  static toPersistence(user: User) {
    return {
      id: user.getId(),
      username: user.getUsername(),
      passwordHash: user.getPasswordHash(),
      email: user.getEmail(),
      isActive: user.getIsActive(),
      createdAt: user.getCreatedAt(),
      lastLoginAt: user.getLastLoginAt(),
    };
  }
}
