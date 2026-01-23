/**
 * HackOperation Mapper
 *
 * Maps between TypeORM HackOperationEntity and domain HackOperation entity.
 * Enforces domain invariants during reconstruction.
 */
import {
  HackOperation,
  createHackOperationId,
  HackStatus,
  HackType,
} from '@netwatch/domain';
import {
  HackOperationEntity,
  HackStatusEnum,
  HackTypeEnum,
} from '../database/entities/hack-operation.entity';

export class HackOperationMapper {
  static toDomain(raw: HackOperationEntity): HackOperation {
    return HackOperation.fromPersistence(
      createHackOperationId(raw.id),
      raw.attacker_id,
      raw.target_computer_id,
      this.mapHackStatus(raw.status),
      this.mapHackType(raw.hack_type),
      raw.tools_used,
      raw.estimated_duration,
      raw.started_at,
      raw.completion_at,
      raw.result_data,
    );
  }

  static toPersistence(hackOperation: HackOperation): Partial<HackOperationEntity> {
    return {
      id: hackOperation.getId(),
      attacker_id: hackOperation.getAttackerId(),
      target_computer_id: hackOperation.getTargetComputerId(),
      status: this.mapHackStatusToEnum(hackOperation.getStatus()),
      hack_type: this.mapHackTypeToEnum(hackOperation.getHackType()),
      tools_used: hackOperation.getToolsUsed(),
      estimated_duration: hackOperation.getEstimatedDuration(),
      started_at: hackOperation.getStartedAt(),
      completion_at: hackOperation.getCompletionAt(),
      result_data: hackOperation.getResultData(),
    };
  }

  private static mapHackStatus(enumValue: HackStatusEnum): HackStatus {
    switch (enumValue) {
      case HackStatusEnum.PENDING:
        return HackStatus.PENDING;
      case HackStatusEnum.IN_PROGRESS:
        return HackStatus.IN_PROGRESS;
      case HackStatusEnum.SUCCEEDED:
        return HackStatus.SUCCEEDED;
      case HackStatusEnum.FAILED:
        return HackStatus.FAILED;
      case HackStatusEnum.ABORTED:
        return HackStatus.ABORTED;
    }
  }

  private static mapHackStatusToEnum(domainStatus: HackStatus): HackStatusEnum {
    switch (domainStatus) {
      case HackStatus.PENDING:
        return HackStatusEnum.PENDING;
      case HackStatus.IN_PROGRESS:
        return HackStatusEnum.IN_PROGRESS;
      case HackStatus.SUCCEEDED:
        return HackStatusEnum.SUCCEEDED;
      case HackStatus.FAILED:
        return HackStatusEnum.FAILED;
      case HackStatus.ABORTED:
        return HackStatusEnum.ABORTED;
    }
  }

  private static mapHackType(enumValue: HackTypeEnum): HackType {
    switch (enumValue) {
      case HackTypeEnum.STEAL_MONEY:
        return HackType.STEAL_MONEY;
      case HackTypeEnum.STEAL_DATA:
        return HackType.STEAL_DATA;
      case HackTypeEnum.INSTALL_VIRUS:
        return HackType.INSTALL_VIRUS;
      case HackTypeEnum.DDOS:
        return HackType.DDOS;
    }
  }

  private static mapHackTypeToEnum(domainType: HackType): HackTypeEnum {
    switch (domainType) {
      case HackType.STEAL_MONEY:
        return HackTypeEnum.STEAL_MONEY;
      case HackType.STEAL_DATA:
        return HackTypeEnum.STEAL_DATA;
      case HackType.INSTALL_VIRUS:
        return HackTypeEnum.INSTALL_VIRUS;
      case HackType.DDOS:
        return HackTypeEnum.DDOS;
    }
  }
}
