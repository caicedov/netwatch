/**
 * HackOperation Repository
 *
 * Encapsulates all database access for HackOperation aggregate.
 * Private to the hacks module.
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { HackOperation } from '@netwatch/domain';
import { HackOperationEntity, HackStatusEnum } from '../../../../infrastructure/database/entities/hack-operation.entity';
import { HackOperationMapper } from '../../../../infrastructure/mappers/hack-operation.mapper';

@Injectable()
export class HackOperationRepository {
  private readonly repository: Repository<HackOperationEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(HackOperationEntity);
  }

  async findById(id: string): Promise<HackOperation | null> {
    const raw = await this.repository.findOne({
      where: { id },
      relations: ['attacker', 'targetComputer'],
    });
    return raw ? HackOperationMapper.toDomain(raw) : null;
  }

  async findByAttackerId(attackerId: string): Promise<HackOperation[]> {
    const raw = await this.repository.find({
      where: { attacker_id: attackerId },
      order: { started_at: 'DESC' },
      relations: ['attacker', 'targetComputer'],
    });
    return raw.map((r) => HackOperationMapper.toDomain(r));
  }

  async findByAttackerIdAndStatus(
    attackerId: string,
    status: string,
  ): Promise<HackOperation[]> {
    const raw = await this.repository.find({
      where: {
        attacker_id: attackerId,
        status: status as HackStatusEnum,
      },
      relations: ['attacker', 'targetComputer'],
    });
    return raw.map((r) => HackOperationMapper.toDomain(r));
  }

  async findByTargetComputerId(targetComputerId: string): Promise<HackOperation[]> {
    const raw = await this.repository.find({
      where: { target_computer_id: targetComputerId },
      order: { started_at: 'DESC' },
      relations: ['attacker', 'targetComputer'],
    });
    return raw.map((r) => HackOperationMapper.toDomain(r));
  }

  async findPendingCompletions(): Promise<HackOperation[]> {
    const raw = await this.repository.find({
      where: {
        status: HackStatusEnum.IN_PROGRESS,
      },
    });

    return raw
      .filter((r) => r.completion_at <= new Date())
      .map((r) => HackOperationMapper.toDomain(r));
  }

  async create(operation: HackOperation): Promise<HackOperation> {
    const raw = await this.repository.save(HackOperationMapper.toPersistence(operation));
    return HackOperationMapper.toDomain(raw);
  }

  async update(operation: HackOperation): Promise<HackOperation> {
    await this.repository.update(
      { id: operation.getId() },
      HackOperationMapper.toPersistence(operation),
    );
    const updated = await this.repository.findOne({
      where: { id: operation.getId() },
      relations: ['attacker', 'targetComputer'],
    });
    if (!updated) {
      throw new Error('HackOperation not found after update');
    }
    return HackOperationMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async countActiveHacksByAttacker(attackerId: string): Promise<number> {
    return this.repository.count({
      where: {
        attacker_id: attackerId,
        status: HackStatusEnum.IN_PROGRESS,
      },
    });
  }

  async countActiveHacksOnTarget(targetComputerId: string): Promise<number> {
    return this.repository.count({
      where: {
        target_computer_id: targetComputerId,
        status: HackStatusEnum.IN_PROGRESS,
      },
    });
  }
}
