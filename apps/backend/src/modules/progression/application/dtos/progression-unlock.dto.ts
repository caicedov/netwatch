/**
 * Progression Unlock Response DTO
 *
 * Public representation of a progression unlock.
 */
export class ProgressionUnlockDto {
  unlockId!: string;
  playerId!: string;
  unlockType!: string;
  unlockKey!: string;
  unlockedAt!: Date;
}
