/**
 * Computer Repository
 *
 * Encapsulates all database access for Computer aggregate.
 * Private to the computers module.
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Computer } from '@netwatch/domain';
import { ComputerEntity } from '../../../../infrastructure/database/entities/computer.entity';
import { ComputerMapper } from '../../../../infrastructure/mappers/computer.mapper';

@Injectable()
export class ComputerRepository {
  private readonly repository: Repository<ComputerEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(ComputerEntity);
  }

  async findById(id: string): Promise<Computer | null> {
    const raw = await this.repository.findOne({
      where: { id },
      relations: ['defenses'],
    });
    return raw ? ComputerMapper.toDomain(raw) : null;
  }

  async findByIpAddress(ipAddress: string): Promise<Computer | null> {
    const raw = await this.repository.findOne({
      where: { ip_address: ipAddress },
      relations: ['defenses'],
    });
    return raw ? ComputerMapper.toDomain(raw) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Computer[]> {
    const raw = await this.repository.find({
      where: { owner_id: ownerId },
      relations: ['defenses'],
    });
    return raw.map((r) => ComputerMapper.toDomain(r));
  }

  async findOnlineComputersExcept(ownerIds: string[]): Promise<Computer[]> {
    const raw = await this.repository.find({
      where: [
        {
          is_online: true,
          owner_id: undefined,
        },
      ],
      relations: ['defenses'],
    });

    return raw
      .filter((r) => !ownerIds.includes(r.owner_id))
      .map((r) => ComputerMapper.toDomain(r));
  }

  async create(computer: Computer): Promise<Computer> {
    const raw = await this.repository.save(ComputerMapper.toPersistence(computer));
    return ComputerMapper.toDomain(raw);
  }

  async update(computer: Computer): Promise<Computer> {
    await this.repository.update(
      { id: computer.getId() },
      ComputerMapper.toPersistence(computer),
    );
    const updated = await this.repository.findOne({
      where: { id: computer.getId() },
      relations: ['defenses'],
    });
    if (!updated) {
      throw new Error('Computer not found after update');
    }
    return ComputerMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async existsWithIpAddress(ipAddress: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { ip_address: ipAddress },
    });
    return count > 0;
  }

  async countByOwnerId(ownerId: string): Promise<number> {
    return this.repository.count({
      where: { owner_id: ownerId },
    });
  }
}
