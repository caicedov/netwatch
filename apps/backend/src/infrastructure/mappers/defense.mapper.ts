/**
 * Defense Mapper
 *
 * Maps between Prisma Defense model and domain Defense entity.
 * Enforces domain invariants during reconstruction.
 */
import { Defense, createDefenseId, DefenseType } from '@netwatch/domain';
import { DefenseType as PrismaDefenseType } from '@prisma/client';
import type { Defense as PrismaDefense } from '@prisma/client';

export class DefenseMapper {
  static toDomain(raw: PrismaDefense): Defense {
    return Defense.fromPersistence(
      createDefenseId(raw.id),
      raw.computerId,
      this.mapDefenseType(raw.defenseType),
      raw.level,
      raw.installedAt,
    );
  }

  static toPersistence(defense: Defense) {
    return {
      id: defense.getId(),
      computerId: defense.getComputerId(),
      defenseType: this.mapDefenseTypeToEnum(defense.getDefenseType()),
      level: defense.getLevel(),
      effectiveness: defense.getEffectiveness(),
      installedAt: defense.getInstalledAt(),
    };
  }

  private static mapDefenseType(enumValue: PrismaDefenseType): DefenseType {
    switch (enumValue) {
      case PrismaDefenseType.FIREWALL:
        return DefenseType.FIREWALL;
      case PrismaDefenseType.ANTIVIRUS:
        return DefenseType.ANTIVIRUS;
      case PrismaDefenseType.HONEYPOT:
        return DefenseType.HONEYPOT;
      case PrismaDefenseType.IDS:
        return DefenseType.IDS;
    }
  }

  private static mapDefenseTypeToEnum(domainType: DefenseType): PrismaDefenseType {
    switch (domainType) {
      case DefenseType.FIREWALL:
        return PrismaDefenseType.FIREWALL;
      case DefenseType.ANTIVIRUS:
        return PrismaDefenseType.ANTIVIRUS;
      case DefenseType.HONEYPOT:
        return PrismaDefenseType.HONEYPOT;
      case DefenseType.IDS:
        return PrismaDefenseType.IDS;
    }
  }
}
