/**
 * ProgressionUnlock Mapper
 *
 * Maps between TypeORM ProgressionUnlockEntity and domain ProgressionUnlock entity.
 * Enforces domain invariants during reconstruction.
 */
import {
  ProgressionUnlock,
  createProgressionUnlockId,
  UnlockType,
} from '@netwatch/domain';
import {
  ProgressionUnlockEntity,
  UnlockTypeEnum,
} from '../database/entities/progression-unlock.entity';

export class ProgressionUnlockMapper {
  static toDomain(raw: ProgressionUnlockEntity): ProgressionUnlock {
    return ProgressionUnlock.fromPersistence(
      createProgressionUnlockId(raw.id),
      raw.player_id,
      this.mapUnlockType(raw.unlock_type),
      raw.unlock_key,
      raw.unlocked_at,
    );
  }

  static toPersistence(unlock: ProgressionUnlock): Partial<ProgressionUnlockEntity> {
    return {
      id: unlock.getId(),
      player_id: unlock.getPlayerId(),
      unlock_type: this.mapUnlockTypeToEnum(unlock.getUnlockType()),
      unlock_key: unlock.getUnlockKey(),
      unlocked_at: unlock.getUnlockedAt(),
    };
  }

  private static mapUnlockType(enumValue: UnlockTypeEnum): UnlockType {
    switch (enumValue) {
      case UnlockTypeEnum.TOOL:
        return UnlockType.TOOL;
      case UnlockTypeEnum.DEFENSE:
        return UnlockType.DEFENSE;
      case UnlockTypeEnum.UPGRADE:
        return UnlockType.UPGRADE;
      case UnlockTypeEnum.SKILL:
        return UnlockType.SKILL;
    }
  }

  private static mapUnlockTypeToEnum(domainType: UnlockType): UnlockTypeEnum {
    switch (domainType) {
      case UnlockType.TOOL:
        return UnlockTypeEnum.TOOL;
      case UnlockType.DEFENSE:
        return UnlockTypeEnum.DEFENSE;
      case UnlockType.UPGRADE:
        return UnlockTypeEnum.UPGRADE;
      case UnlockType.SKILL:
        return UnlockTypeEnum.SKILL;
    }
  }
}
