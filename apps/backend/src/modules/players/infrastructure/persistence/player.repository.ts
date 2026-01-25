/**
 * Player Repository
 *
 * Encapsulates all database access for Player aggregate.
 * Private to the players module.
 */
import { Injectable } from '@nestjs/common';
import { Player } from '@netwatch/domain';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { PlayerMapper } from '../../../../infrastructure/mappers/player.mapper';

@Injectable()
export class PlayerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Player | null> {
    const raw = await this.prisma.player.findUnique({
      where: { id },
    });
    return raw ? PlayerMapper.toDomain(raw) : null;
  }

  async findByUserId(userId: string): Promise<Player | null> {
    const raw = await this.prisma.player.findUnique({
      where: { userId },
    });
    return raw ? PlayerMapper.toDomain(raw) : null;
  }

  async create(player: Player): Promise<Player> {
    const raw = await this.prisma.player.create({
      data: PlayerMapper.toPersistence(player),
    });
    return PlayerMapper.toDomain(raw);
  }

  async update(player: Player): Promise<Player> {
    const raw = await this.prisma.player.update({
      where: { id: player.getId() },
      data: PlayerMapper.toPersistence(player),
    });
    return PlayerMapper.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.player.delete({
      where: { id },
    });
  }

  async existsWithUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.player.count({
      where: { userId },
    });
    return count > 0;
  }

  async getTopPlayersByLevel(limit: number): Promise<Player[]> {
    const raw = await this.prisma.player.findMany({
      orderBy: [{ level: 'desc' }, { experience: 'desc' }],
      take: limit,
    });
    return raw.map((r) => PlayerMapper.toDomain(r));
  }

  async getPlayersByExperienceRange(minExp: bigint, maxExp: bigint): Promise<Player[]> {
    const raw = await this.prisma.player.findMany({
      where: {
        experience: {
          gte: minExp,
          lte: maxExp,
        },
      },
    });
    return raw.map((r) => PlayerMapper.toDomain(r));
  }
}
