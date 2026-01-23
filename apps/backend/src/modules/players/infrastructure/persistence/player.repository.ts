/**
 * Player Repository
 *
 * Encapsulates all database access for Player aggregate.
 * Private to the players module.
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Player } from '@netwatch/domain';
import { PlayerEntity } from '../../../../infrastructure/database/entities/player.entity';
import { PlayerMapper } from '../../../../infrastructure/mappers/player.mapper';

@Injectable()
export class PlayerRepository {
  private readonly repository: Repository<PlayerEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(PlayerEntity);
  }

  async findById(id: string): Promise<Player | null> {
    const raw = await this.repository.findOne({
      where: { id },
    });
    return raw ? PlayerMapper.toDomain(raw) : null;
  }

  async findByUserId(userId: string): Promise<Player | null> {
    const raw = await this.repository.findOne({
      where: { user_id: userId },
    });
    return raw ? PlayerMapper.toDomain(raw) : null;
  }

  async create(player: Player): Promise<Player> {
    const raw = await this.repository.save(PlayerMapper.toPersistence(player));
    return PlayerMapper.toDomain(raw);
  }

  async update(player: Player): Promise<Player> {
    await this.repository.update({ id: player.getId() }, PlayerMapper.toPersistence(player));
    const updated = await this.repository.findOne({
      where: { id: player.getId() },
    });
    if (!updated) {
      throw new Error('Player not found after update');
    }
    return PlayerMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async existsWithUserId(userId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { user_id: userId },
    });
    return count > 0;
  }

  async getTopPlayersByLevel(limit: number): Promise<Player[]> {
    const raw = await this.repository.find({
      order: { level: 'DESC', experience: 'DESC' },
      take: limit,
    });
    return raw.map((r) => PlayerMapper.toDomain(r));
  }

  async getPlayersByExperienceRange(minExp: bigint, maxExp: bigint): Promise<Player[]> {
    const raw = await this.repository
      .createQueryBuilder('p')
      .where('p.experience >= :min', { min: Number(minExp) })
      .andWhere('p.experience <= :max', { max: Number(maxExp) })
      .getMany();
    return raw.map((r) => PlayerMapper.toDomain(r));
  }
}
