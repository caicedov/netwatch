/**
 * User Repository
 *
 * Encapsulates all database access for User aggregate.
 * Private to the users module.
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '@netwatch/domain';
import { UserEntity } from '../../../../infrastructure/database/entities/user.entity';
import { UserMapper } from '../../../../infrastructure/mappers/user.mapper';

@Injectable()
export class UserRepository {
  private readonly repository: Repository<UserEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserEntity);
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { id },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { username },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.repository.findOne({
      where: { email },
    });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async create(user: User): Promise<User> {
    const raw = await this.repository.save(UserMapper.toPersistence(user));
    return UserMapper.toDomain(raw);
  }

  async update(user: User): Promise<User> {
    await this.repository.update({ id: user.getId() }, UserMapper.toPersistence(user));
    const updated = await this.repository.findOne({
      where: { id: user.getId() },
    });
    if (!updated) {
      throw new Error('User not found after update');
    }
    return UserMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async existsWithUsername(username: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { username },
    });
    return count > 0;
  }

  async existsWithEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email },
    });
    return count > 0;
  }
}
