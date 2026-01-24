import { Injectable, NotFoundException } from '@nestjs/common';
import { Player, PlayerId } from '@netwatch/domain';
import { PlayerRepository } from '../../infrastructure/persistence/player.repository';

/**
 * Get Player Profile Use Case
 *
 * Retrieves complete player profile with all resources and progression.
 * Enforces authorization: only the player owner can view their own profile.
 */
@Injectable()
export class GetPlayerProfileUseCase {
  constructor(private readonly playerRepository: PlayerRepository) {}

  /**
   * Execute player profile retrieval.
   *
   * @param playerId - ID of player to retrieve
   * @param requestingUserId - ID of user making request (for authorization)
   * @returns Promise<Player> the player aggregate
   * @throws NotFoundException if player not found
   * @throws ForbiddenException if user not authorized
   */
  async execute(playerId: string, requestingUserId: string): Promise<Player> {
    const player = await this.playerRepository.findById(playerId as PlayerId);

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    // Authorization check
    if (player.getUserId() !== requestingUserId) {
      throw new Error('Unauthorized: cannot view other players profile');
    }

    return player;
  }
}
