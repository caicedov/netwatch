/**
 * Defense Repository
 *
 * Encapsulates all database access for Defense entities.
 * Private to the computers module.
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Defense } from '@netwatch/domain';
import { DefenseEntity } from '../../../../infrastructure/database/entities/defense.entity';
import { DefenseMapper } from '../../../../infrastructure/mappers/defense.mapper';

@Injectable()
export class DefenseRepository {
  private readonly repository: Repository<DefenseEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(DefenseEntity);
  }

  async findById(id: string): Promise<Defense | null> {
    const raw = await this.repository.findOne({
      where: { id },
    });
    return raw ? DefenseMapper.toDomain(raw) : null;
  }

  async findByComputerId(computerId: string): Promise<Defense[]> {
    const raw = await this.repository.find({
      where: { computer_id: computerId },
    });
    return raw.map((r) => DefenseMapper.toDomain(r));
  }

  async findByComputerIdAndType(computerId: string, defenseType: string): Promise<Defense | null> {
    const raw = await this.repository.findOne({
      where: {
        computer_id: computerId,
        defense_type: defenseType as any,
      },
    });
    return raw ? DefenseMapper.toDomain(raw) : null;
  }

  async create(defense: Defense): Promise<Defense> {
    const raw = await this.repository.save(DefenseMapper.toPersistence(defense));
    return DefenseMapper.toDomain(raw);
  }

  async update(defense: Defense): Promise<Defense> {
    await this.repository.update(
      { id: defense.getId() },
      DefenseMapper.toPersistence(defense),
    );
    const updated = await this.repository.findOne({
      where: { id: defense.getId() },
    });
    if (!updated) {
      throw new Error('Defense not found after update');
    }
    return DefenseMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async deleteByComputerId(computerId: string): Promise<void> {
    await this.repository.delete({ computer_id: computerId });
  }

  async existsForComputer(computerId: string, defenseType: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        computer_id: computerId,
        defense_type: defenseType as any,
      },
    });
    return count > 0;
  }
}
