/**
 * ProgressionUnlock Repository
 *
 * Encapsulates all database access for ProgressionUnlock entities.
 * Private to the progression module.
 */
import { Injectable } from '@nestjs/common';
import { ProgressionUnlock } from '@netwatch/domain';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { ProgressionUnlockMapper } from '../../../../infrastructure/mappers/progression-unlock.mapper';
import { UnlockType } from '@prisma/client';

@Injectable()
export class ProgressionUnlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProgressionUnlock | null> {
    const raw = await this.prisma.progressionUnlock.findUnique({
      where: { id },
    });
    return raw ? ProgressionUnlockMapper.toDomain(raw) : null;
  }

  async findByPlayerId(playerId: string): Promise<ProgressionUnlock[]> {
    const raw = await this.prisma.progressionUnlock.findMany({
      where: { playerId },
      orderBy: { unlockedAt: 'asc' },
    });
    return raw.map((r) => ProgressionUnlockMapper.toDomain(r));
  }

  async findByPlayerIdAndKey(playerId: string, unlockKey: string): Promise<ProgressionUnlock | null> {
    const raw = await this.prisma.progressionUnlock.findUnique({
      where: {
        playerId_unlockKey: {
          playerId,
          unlockKey,
        },
      },
    });
    return raw ? ProgressionUnlockMapper.toDomain(raw) : null;
  }

  async create(unlock: ProgressionUnlock): Promise<ProgressionUnlock> {
    const raw = await this.prisma.progressionUnlock.create({
      data: ProgressionUnlockMapper.toPersistence(unlock),
    });
    return ProgressionUnlockMapper.toDomain(raw);
  }

  async update(unlock: ProgressionUnlock): Promise<ProgressionUnlock> {
    const raw = await this.prisma.progressionUnlock.update({
      where: { id: unlock.getId() },
      data: ProgressionUnlockMapper.toPersistence(unlock),
    });
    return ProgressionUnlockMapper.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.progressionUnlock.delete({
      where: { id },
    });
  }

  async deleteByPlayerIdAndKey(playerId: string, unlockKey: string): Promise<void> {
    await this.prisma.progressionUnlock.delete({
      where: {
        playerId_unlockKey: {
          playerId,
          unlockKey,
        },
      },
    });
  }

  async hasUnlock(playerId: string, unlockKey: string): Promise<boolean> {
    const count = await this.prisma.progressionUnlock.count({
      where: {
        playerId,
        unlockKey,
      },
    });
    return count > 0;
  }

  async countUnlocksByType(playerId: string, unlockType: string): Promise<number> {
    return this.prisma.progressionUnlock.count({
      where: {
        playerId,
        unlockType: unlockType as UnlockType,
      },
    });
  }
}
