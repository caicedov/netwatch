/**
 * HackOperation Mapper
 *
 * Maps between Prisma HackOperation model and domain HackOperation entity.
 * Enforces domain invariants during reconstruction.
 */
import {
  HackOperation,
  createHackOperationId,
  HackStatus,
  HackType,
} from '@netwatch/domain';
import {
  HackStatus as PrismaHackStatus,
  HackType as PrismaHackType,
} from '@prisma/client';
import type { HackOperation as PrismaHackOperation } from '@prisma/client';

export class HackOperationMapper {
  static toDomain(raw: PrismaHackOperation): HackOperation {
    return HackOperation.fromPersistence(
      createHackOperationId(raw.id),
      raw.attackerId,
      raw.targetComputerId,
      this.mapHackStatus(raw.status),
      this.mapHackType(raw.hackType),
      raw.toolsUsed as string[],
      raw.estimatedDuration,
      raw.startedAt,
      raw.completionAt,
      raw.resultData as Record<string, unknown> | null,
    );
  }

  static toPersistence(hackOperation: HackOperation) {
    return {
      id: hackOperation.getId(),
      attackerId: hackOperation.getAttackerId(),
      targetComputerId: hackOperation.getTargetComputerId(),
      status: this.mapHackStatusToEnum(hackOperation.getStatus()),
      hackType: this.mapHackTypeToEnum(hackOperation.getHackType()),
      toolsUsed: hackOperation.getToolsUsed(),
      estimatedDuration: hackOperation.getEstimatedDuration(),
      startedAt: hackOperation.getStartedAt(),
      completionAt: hackOperation.getCompletionAt(),
      resultData: hackOperation.getResultData(),
    };
  }

  private static mapHackStatus(enumValue: PrismaHackStatus): HackStatus {
    switch (enumValue) {
      case PrismaHackStatus.PENDING:
        return HackStatus.PENDING;
      case PrismaHackStatus.IN_PROGRESS:
        return HackStatus.IN_PROGRESS;
      case PrismaHackStatus.SUCCEEDED:
        return HackStatus.SUCCEEDED;
      case PrismaHackStatus.FAILED:
        return HackStatus.FAILED;
      case PrismaHackStatus.ABORTED:
        return HackStatus.ABORTED;
    }
  }

  private static mapHackStatusToEnum(domainStatus: HackStatus): PrismaHackStatus {
    switch (domainStatus) {
      case HackStatus.PENDING:
        return PrismaHackStatus.PENDING;
      case HackStatus.IN_PROGRESS:
        return PrismaHackStatus.IN_PROGRESS;
      case HackStatus.SUCCEEDED:
        return PrismaHackStatus.SUCCEEDED;
      case HackStatus.FAILED:
        return PrismaHackStatus.FAILED;
      case HackStatus.ABORTED:
        return PrismaHackStatus.ABORTED;
    }
  }

  private static mapHackType(enumValue: PrismaHackType): HackType {
    switch (enumValue) {
      case PrismaHackType.STEAL_MONEY:
        return HackType.STEAL_MONEY;
      case PrismaHackType.STEAL_DATA:
        return HackType.STEAL_DATA;
      case PrismaHackType.INSTALL_VIRUS:
        return HackType.INSTALL_VIRUS;
      case PrismaHackType.DDOS:
        return HackType.DDOS;
    }
  }

  private static mapHackTypeToEnum(domainType: HackType): PrismaHackType {
    switch (domainType) {
      case HackType.STEAL_MONEY:
        return PrismaHackType.STEAL_MONEY;
      case HackType.STEAL_DATA:
        return PrismaHackType.STEAL_DATA;
      case HackType.INSTALL_VIRUS:
        return PrismaHackType.INSTALL_VIRUS;
      case HackType.DDOS:
        return PrismaHackType.DDOS;
    }
  }
}
