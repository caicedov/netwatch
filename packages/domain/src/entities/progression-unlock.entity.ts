/**
 * Unlock Type Enum
 */
export enum UnlockType {
  TOOL = 'tool',
  DEFENSE = 'defense',
  UPGRADE = 'upgrade',
  SKILL = 'skill',
}

/**
 * ProgressionUnlock Entity
 *
 * Tracks features/tools/upgrades available to a player.
 */
export type ProgressionUnlockId = string & { readonly __progressionUnlockId: unique symbol };

export const createProgressionUnlockId = (id: string): ProgressionUnlockId =>
  id as ProgressionUnlockId;

export class ProgressionUnlock {
  private readonly id: ProgressionUnlockId;
  private readonly playerId: string;
  private readonly unlockType: UnlockType;
  private readonly unlockKey: string;
  private readonly unlockedAt: Date;

  private constructor(
    id: ProgressionUnlockId,
    playerId: string,
    unlockType: UnlockType,
    unlockKey: string,
    unlockedAt: Date,
  ) {
    if (!unlockKey || unlockKey.length === 0) {
      throw new Error('Unlock key cannot be empty');
    }

    this.id = id;
    this.playerId = playerId;
    this.unlockType = unlockType;
    this.unlockKey = unlockKey;
    this.unlockedAt = unlockedAt;
  }

  static create(
    id: ProgressionUnlockId,
    playerId: string,
    unlockType: UnlockType,
    unlockKey: string,
  ): ProgressionUnlock {
    return new ProgressionUnlock(id, playerId, unlockType, unlockKey, new Date());
  }

  static fromPersistence(
    id: ProgressionUnlockId,
    playerId: string,
    unlockType: UnlockType,
    unlockKey: string,
    unlockedAt: Date,
  ): ProgressionUnlock {
    return new ProgressionUnlock(id, playerId, unlockType, unlockKey, unlockedAt);
  }

  getId(): ProgressionUnlockId {
    return this.id;
  }

  getPlayerId(): string {
    return this.playerId;
  }

  getUnlockType(): UnlockType {
    return this.unlockType;
  }

  getUnlockKey(): string {
    return this.unlockKey;
  }

  getUnlockedAt(): Date {
    return new Date(this.unlockedAt);
  }
}
