/**
 * Player Mapper
 *
 * Maps between Prisma Player model and domain Player entity.
 * Enforces domain invariants during reconstruction.
 */
import { Player, createPlayerId } from '@netwatch/domain';
import type { Player as PrismaPlayer } from '@prisma/client';

export class PlayerMapper {
  static toDomain(raw: PrismaPlayer): Player {
    return Player.fromPersistence(
      createPlayerId(raw.id),
      raw.userId,
      raw.displayName,
      raw.createdAt,
      raw.energy,
      raw.energyMax,
      BigInt(raw.money),
      BigInt(raw.experience),
      raw.skillPoints,
    );
  }

  static toPersistence(player: Player) {
    return {
      id: player.getId(),
      userId: player.getUserId(),
      displayName: player.getDisplayName(),
      energy: player.getEnergy().getCurrent(),
      energyMax: player.getEnergy().getMax(),
      money: player.getMoney().toNumber(),
      experience: Number(player.getExperience()),
      skillPoints: player.getSkillPoints(),
      createdAt: player.getCreatedAt(),
    };
  }
}
