/**
 * Hack Status Enum
 */
export enum HackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  ABORTED = 'aborted',
}

/**
 * Hack Type Enum
 */
export enum HackType {
  STEAL_MONEY = 'steal_money',
  STEAL_DATA = 'steal_data',
  INSTALL_VIRUS = 'install_virus',
  DDOS = 'ddos',
}

/**
 * HackOperation Entity
 *
 * Represents an ongoing or completed hacking attempt.
 * Root aggregate for the HackOperation domain.
 */
export type HackOperationId = string & { readonly __hackOperationId: unique symbol };

export const createHackOperationId = (id: string): HackOperationId => id as HackOperationId;

export class HackOperation {
  private readonly id: HackOperationId;
  private readonly attackerId: string;
  private readonly targetComputerId: string;
  private status: HackStatus;
  private readonly hackType: HackType;
  private readonly toolsUsed: string[];
  private readonly estimatedDuration: number;
  private readonly startedAt: Date;
  private readonly completionAt: Date;
  private resultData: Record<string, unknown> | null;

  private constructor(
    id: HackOperationId,
    attackerId: string,
    targetComputerId: string,
    status: HackStatus,
    hackType: HackType,
    toolsUsed: string[],
    estimatedDuration: number,
    startedAt: Date,
    completionAt: Date,
    resultData: Record<string, unknown> | null,
  ) {
    if (estimatedDuration <= 0) {
      throw new Error('Estimated duration must be positive');
    }
    if (completionAt <= startedAt) {
      throw new Error('Completion time must be after start time');
    }
    if (attackerId === targetComputerId) {
      throw new Error('Cannot hack own computer');
    }

    this.id = id;
    this.attackerId = attackerId;
    this.targetComputerId = targetComputerId;
    this.status = status;
    this.hackType = hackType;
    this.toolsUsed = toolsUsed;
    this.estimatedDuration = estimatedDuration;
    this.startedAt = startedAt;
    this.completionAt = completionAt;
    this.resultData = resultData;
  }

  static create(
    id: HackOperationId,
    attackerId: string,
    targetComputerId: string,
    hackType: HackType,
    toolsUsed: string[],
    estimatedDuration: number,
  ): HackOperation {
    const now = new Date();
    const completionAt = new Date(now.getTime() + estimatedDuration * 1000);

    return new HackOperation(
      id,
      attackerId,
      targetComputerId,
      HackStatus.PENDING,
      hackType,
      toolsUsed,
      estimatedDuration,
      now,
      completionAt,
      null,
    );
  }

  static fromPersistence(
    id: HackOperationId,
    attackerId: string,
    targetComputerId: string,
    status: HackStatus,
    hackType: HackType,
    toolsUsed: string[],
    estimatedDuration: number,
    startedAt: Date,
    completionAt: Date,
    resultData: Record<string, unknown> | null,
  ): HackOperation {
    return new HackOperation(
      id,
      attackerId,
      targetComputerId,
      status,
      hackType,
      toolsUsed,
      estimatedDuration,
      startedAt,
      completionAt,
      resultData,
    );
  }

  getId(): HackOperationId {
    return this.id;
  }

  getAttackerId(): string {
    return this.attackerId;
  }

  getTargetComputerId(): string {
    return this.targetComputerId;
  }

  getStatus(): HackStatus {
    return this.status;
  }

  getHackType(): HackType {
    return this.hackType;
  }

  getToolsUsed(): string[] {
    return [...this.toolsUsed];
  }

  getEstimatedDuration(): number {
    return this.estimatedDuration;
  }

  getStartedAt(): Date {
    return new Date(this.startedAt);
  }

  getCompletionAt(): Date {
    return new Date(this.completionAt);
  }

  getResultData(): Record<string, unknown> | null {
    return this.resultData ? { ...this.resultData } : null;
  }

  isReady(): boolean {
    return new Date() >= this.completionAt;
  }

  transition(newStatus: HackStatus, resultData?: Record<string, unknown>): HackOperation {
    this.validateTransition(this.status, newStatus);

    return new HackOperation(
      this.id,
      this.attackerId,
      this.targetComputerId,
      newStatus,
      this.hackType,
      this.toolsUsed,
      this.estimatedDuration,
      this.startedAt,
      this.completionAt,
      resultData || this.resultData,
    );
  }

  private validateTransition(from: HackStatus, to: HackStatus): void {
    const validTransitions: Record<HackStatus, HackStatus[]> = {
      [HackStatus.PENDING]: [HackStatus.IN_PROGRESS, HackStatus.ABORTED],
      [HackStatus.IN_PROGRESS]: [HackStatus.SUCCEEDED, HackStatus.FAILED, HackStatus.ABORTED],
      [HackStatus.SUCCEEDED]: [],
      [HackStatus.FAILED]: [],
      [HackStatus.ABORTED]: [],
    };

    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid transition from ${from} to ${to}`);
    }
  }
}
