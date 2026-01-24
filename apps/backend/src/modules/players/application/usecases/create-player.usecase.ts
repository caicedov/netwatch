import { Injectable, NotFoundException } from '@nestjs/common';
import { Player, PlayerId, createPlayerId } from '@netwatch/domain';
import { PlayerRepository } from '../../infrastructure/persistence/player.repository';
import { v4 as uuid } from 'uuid';

/**
 * Create Player Use Case
 *
 * Creates a new player aggregate for a registered user.
 * - Enforces 1:1 relationship between User and Player
 * - Initializes player with default resources (1000 money, 100 energy)
 * - Assigned to players domain
 */
@Injectable()
export class CreatePlayerUseCase {
  constructor(private readonly playerRepository: PlayerRepository) {}

  /**
   * Execute player creation.
   *
   * @param userId - ID of registered user
   * @param username - Player username (inherited from user)
   * @returns Promise<Player> the created player
   * @throws Conflict if player already exists for user
   */
  async execute(userId: string, username: string): Promise<Player> {
    // Check if player already exists for this user
    const existing = await this.playerRepository.findByUserId(userId);
    if (existing) {
      throw new Error('Player already exists for this user');
    }

    // Create player aggregate
    const playerId = createPlayerId(uuid());
    const player = Player.create(playerId, userId, username);

    // Persist to repository
    return await this.playerRepository.create(player);
  }
}
