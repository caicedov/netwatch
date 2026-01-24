import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProgressionUnlock, ProgressionUnlockId, UnlockType, createProgressionUnlockId } from '@netwatch/domain';
import { ProgressionUnlockRepository } from '../../infrastructure/persistence/progression-unlock.repository';
import { PlayerRepository } from '../../../players/infrastructure/persistence/player.repository';
import { v4 as uuid } from 'uuid';

/**
 * Unlock Progression Use Case
 *
 * Grants a progression unlock to a player (tool, defense, upgrade, skill).
 * - Validates unlock requirements per type
 * - Prevents duplicate unlocks
 * - Updates player progression state
 */
@Injectable()
export class UnlockProgressionUseCase {
  constructor(
    private readonly progressionUnlockRepository: ProgressionUnlockRepository,
    private readonly playerRepository: PlayerRepository,
  ) {}

  /**
   * Execute unlock progression.
   *
   * @param playerId - ID of player receiving unlock
   * @param unlockType - Type of unlock (tool, defense, upgrade, skill)
   * @param unlockKey - Unique key for this unlock (e.g., 'tool_sqlmap', 'defense_ids_level3')
   * @returns Promise<ProgressionUnlock> the created unlock
   * @throws NotFoundException if player not found
   * @throws BadRequestException if requirements not met
   */
  async execute(
    playerId: string,
    unlockType: UnlockType,
    unlockKey: string,
  ): Promise<ProgressionUnlock> {
    // Verify player exists
    const player = await this.playerRepository.findById(playerId);
    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    // Check if unlock already exists for this player
    const existing = await this.progressionUnlockRepository.findByPlayerIdAndKey(
      playerId,
      unlockKey,
    );
    if (existing) {
      throw new BadRequestException('Unlock already granted to this player');
    }

    // Verify unlock requirements (simplified; extend as needed)
    // Example: level requirements, resource costs, etc.
    this.validateUnlockRequirements(player, unlockType, unlockKey);

    // Create unlock aggregate
    const unlockId = createProgressionUnlockId(uuid());
    const unlock = ProgressionUnlock.create(
      unlockId,
      playerId,
      unlockType,
      unlockKey,
    );

    // Persist to repository
    return await this.progressionUnlockRepository.create(unlock);
  }

  /**
   * Validate unlock requirements per type.
   * Extensible point for future requirement rules.
   */
  private validateUnlockRequirements(
    player: any,
    unlockType: UnlockType,
    unlockKey: string,
  ): void {
    switch (unlockType) {
      case 'tool':
        // Example: require level >= 3
        if (player.getLevel && player.getLevel() < 3) {
          throw new BadRequestException('Requires level 3 or higher');
        }
        break;
      case 'defense':
        // Example: require money >= 500
        if (player.getMoney && player.getMoney().isLessThan) {
          const requiredMoney = 500n;
          if (!player.getMoney().isGreaterThanOrEqual) {
            throw new BadRequestException('Insufficient funds');
          }
        }
        break;
      case 'upgrade':
      case 'skill':
        // Custom logic per unlock key
        break;
    }
  }
}
