/**
 * Defense Repository
 *
 * Encapsulates all database access for Defense entities.
 * Private to the computers module.
 */
import { Injectable } from '@nestjs/common';
import { Defense } from '@netwatch/domain';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { DefenseMapper } from '../../../../infrastructure/mappers/defense.mapper';
import { DefenseType } from '@prisma/client';

@Injectable()
export class DefenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Defense | null> {
    const raw = await this.prisma.defense.findUnique({
      where: { id },
    });
    return raw ? DefenseMapper.toDomain(raw) : null;
  }

  async findByComputerId(computerId: string): Promise<Defense[]> {
    const raw = await this.prisma.defense.findMany({
      where: { computerId },
    });
    return raw.map((r) => DefenseMapper.toDomain(r));
  }

  async findByComputerIdAndType(computerId: string, defenseType: string): Promise<Defense | null> {
    const raw = await this.prisma.defense.findUnique({
      where: {
        computerId_defenseType: {
          computerId,
          defenseType: defenseType as DefenseType,
        },
      },
    });
    return raw ? DefenseMapper.toDomain(raw) : null;
  }

  async create(defense: Defense): Promise<Defense> {
    const raw = await this.prisma.defense.create({
      data: DefenseMapper.toPersistence(defense),
    });
    return DefenseMapper.toDomain(raw);
  }

  async update(defense: Defense): Promise<Defense> {
    const raw = await this.prisma.defense.update({
      where: { id: defense.getId() },
      data: DefenseMapper.toPersistence(defense),
    });
    return DefenseMapper.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.defense.delete({
      where: { id },
    });
  }

  async deleteByComputerId(computerId: string): Promise<void> {
    await this.prisma.defense.deleteMany({
      where: { computerId },
    });
  }

  async existsForComputer(computerId: string, defenseType: string): Promise<boolean> {
    const count = await this.prisma.defense.count({
      where: {
        computerId,
        defenseType: defenseType as DefenseType,
      },
    });
    return count > 0;
  }
}
