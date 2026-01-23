/**
 * User Mapper
 *
 * Maps between TypeORM UserEntity and domain User entity.
 * Enforces domain invariants during reconstruction.
 */
import { User } from '@netwatch/domain';
import { UserEntity } from '../database/entities/user.entity';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    return User.fromPersistence(
      raw.id,
      raw.username,
      raw.password_hash,
      raw.email,
      raw.created_at,
      raw.last_login_at,
      raw.is_active,
    );
  }

  static toPersistence(user: User): Partial<UserEntity> {
    return {
      id: user.getId(),
      username: user.getUsername(),
      password_hash: user.getPasswordHash(),
      email: user.getEmail(),
      is_active: user.getIsActive(),
      created_at: user.getCreatedAt(),
      last_login_at: user.getLastLoginAt(),
    };
  }
}
