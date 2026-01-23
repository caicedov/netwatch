/**
 * ProgressionUnlock Repository
 *
 * Encapsulates all database access for ProgressionUnlock entities.
 * Private to the progression module.
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProgressionUnlock } from '@netwatch/domain';
import { ProgressionUnlockEntity } from '../../../../infrastructure/database/entities/progression-unlock.entity';
import { ProgressionUnlockMapper } from '../../../../infrastructure/mappers/progression-unlock.mapper';

@Injectable()
export class ProgressionUnlockRepository {
  private readonly repository: Repository<ProgressionUnlockEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(ProgressionUnlockEntity);
  }

  async findById(id: string): Promise<ProgressionUnlock | null> {
    const raw = await this.repository.findOne({
      where: { id },
    });
    return raw ? ProgressionUnlockMapper.toDomain(raw) : null;
  }

  async findByPlayerId(playerId: string): Promise<ProgressionUnlock[]> {
    const raw = await this.repository.find({
      where: { player_id: playerId },
      order: { unlocked_at: 'ASC' },
    });
    return raw.map((r) => ProgressionUnlockMapper.toDomain(r));
  }

  async findByPlayerIdAndKey(playerId: string, unlockKey: string): Promise<ProgressionUnlock | null> {
    const raw = await this.repository.findOne({
      where: {
        player_id: playerId,
        unlock_key: unlockKey,
      },
    });
    return raw ? ProgressionUnlockMapper.toDomain(raw) : null;
  }

  async create(unlock: ProgressionUnlock): Promise<ProgressionUnlock> {
    const raw = await this.repository.save(ProgressionUnlockMapper.toPersistence(unlock));
    return ProgressionUnlockMapper.toDomain(raw);
  }

  async update(unlock: ProgressionUnlock): Promise<ProgressionUnlock> {
    await this.repository.update(
      { id: unlock.getId() },
      ProgressionUnlockMapper.toPersistence(unlock),
    );
    const updated = await this.repository.findOne({
      where: { id: unlock.getId() },
    });
    if (!updated) {
      throw new Error('ProgressionUnlock not found after update');
    }
    return ProgressionUnlockMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async deleteByPlayerIdAndKey(playerId: string, unlockKey: string): Promise<void> {
    await this.repository.delete({
      player_id: playerId,
      unlock_key: unlockKey,
    });
  }

  async hasUnlock(playerId: string, unlockKey: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        player_id: playerId,
        unlock_key: unlockKey,
      },
    });
    return count > 0;
  }

  async countUnlocksByType(playerId: string, unlockType: string): Promise<number> {
    return this.repository.count({
      where: {
        player_id: playerId,
        unlock_type: unlockType as any,
      },
    });
  }
}
