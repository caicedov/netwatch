/**
 * ProgressionUnlock Mapper
 *
 * Maps between Prisma ProgressionUnlock model and domain ProgressionUnlock entity.
 * Enforces domain invariants during reconstruction.
 */
import {
  ProgressionUnlock,
  createProgressionUnlockId,
  UnlockType,
} from '@netwatch/domain';
import { UnlockType as PrismaUnlockType } from '@prisma/client';
import type { ProgressionUnlock as PrismaProgressionUnlock } from '@prisma/client';

export class ProgressionUnlockMapper {
  static toDomain(raw: PrismaProgressionUnlock): ProgressionUnlock {
    return ProgressionUnlock.fromPersistence(
      createProgressionUnlockId(raw.id),
      raw.playerId,
      this.mapUnlockType(raw.unlockType),
      raw.unlockKey,
      raw.unlockedAt,
    );
  }

  static toPersistence(unlock: ProgressionUnlock) {
    return {
      id: unlock.getId(),
      playerId: unlock.getPlayerId(),
      unlockType: this.mapUnlockTypeToEnum(unlock.getUnlockType()),
      unlockKey: unlock.getUnlockKey(),
      unlockedAt: unlock.getUnlockedAt(),
    };
  }

  private static mapUnlockType(enumValue: PrismaUnlockType): UnlockType {
    switch (enumValue) {
      case PrismaUnlockType.TOOL:
        return UnlockType.TOOL;
      case PrismaUnlockType.DEFENSE:
        return UnlockType.DEFENSE;
      case PrismaUnlockType.UPGRADE:
        return UnlockType.UPGRADE;
      case PrismaUnlockType.SKILL:
        return UnlockType.SKILL;
    }
  }

  private static mapUnlockTypeToEnum(domainType: UnlockType): PrismaUnlockType {
    switch (domainType) {
      case UnlockType.TOOL:
        return PrismaUnlockType.TOOL;
      case UnlockType.DEFENSE:
        return PrismaUnlockType.DEFENSE;
      case UnlockType.UPGRADE:
        return PrismaUnlockType.UPGRADE;
      case UnlockType.SKILL:
        return PrismaUnlockType.SKILL;
    }
  }
}
