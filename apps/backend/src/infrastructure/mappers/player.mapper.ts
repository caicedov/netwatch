/**
 * Player Mapper
 *
 * Maps between TypeORM PlayerEntity and domain Player entity.
 * Enforces domain invariants during reconstruction.
 */
import { Player, createPlayerId } from '@netwatch/domain';
import { PlayerEntity } from '../database/entities/player.entity';

export class PlayerMapper {
  static toDomain(raw: PlayerEntity): Player {
    return Player.fromPersistence(
      createPlayerId(raw.id),
      raw.user_id,
      raw.display_name,
      raw.created_at,
      raw.energy,
      raw.energy_max,
      BigInt(raw.money),
      BigInt(raw.experience),
      raw.skill_points,
    );
  }

  static toPersistence(player: Player): Partial<PlayerEntity> {
    return {
      id: player.getId(),
      user_id: player.getUserId(),
      display_name: player.getDisplayName(),
      energy: player.getEnergy().getCurrent(),
      energy_max: player.getEnergy().getMax(),
      money: player.getMoney().toNumber(),
      experience: Number(player.getExperience()),
      skill_points: player.getSkillPoints(),
      created_at: player.getCreatedAt(),
    };
  }
}
