/**
 * Defense Mapper
 *
 * Maps between TypeORM DefenseEntity and domain Defense entity.
 * Enforces domain invariants during reconstruction.
 */
import { Defense, createDefenseId, DefenseType } from '@netwatch/domain';
import { DefenseEntity, DefenseTypeEnum } from '../database/entities/defense.entity';

export class DefenseMapper {
  static toDomain(raw: DefenseEntity): Defense {
    return Defense.fromPersistence(
      createDefenseId(raw.id),
      raw.computer_id,
      this.mapDefenseType(raw.defense_type),
      raw.level,
      raw.installed_at,
    );
  }

  static toPersistence(defense: Defense): Partial<DefenseEntity> {
    return {
      id: defense.getId(),
      computer_id: defense.getComputerId(),
      defense_type: this.mapDefenseTypeToEnum(defense.getDefenseType()),
      level: defense.getLevel(),
      installed_at: defense.getInstalledAt(),
    };
  }

  private static mapDefenseType(enumValue: DefenseTypeEnum): DefenseType {
    switch (enumValue) {
      case DefenseTypeEnum.FIREWALL:
        return DefenseType.FIREWALL;
      case DefenseTypeEnum.ANTIVIRUS:
        return DefenseType.ANTIVIRUS;
      case DefenseTypeEnum.HONEYPOT:
        return DefenseType.HONEYPOT;
      case DefenseTypeEnum.IDS:
        return DefenseType.IDS;
    }
  }

  private static mapDefenseTypeToEnum(domainType: DefenseType): DefenseTypeEnum {
    switch (domainType) {
      case DefenseType.FIREWALL:
        return DefenseTypeEnum.FIREWALL;
      case DefenseType.ANTIVIRUS:
        return DefenseTypeEnum.ANTIVIRUS;
      case DefenseType.HONEYPOT:
        return DefenseTypeEnum.HONEYPOT;
      case DefenseType.IDS:
        return DefenseTypeEnum.IDS;
    }
  }
}
