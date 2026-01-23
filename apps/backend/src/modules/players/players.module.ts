/**
 * Players Module
 *
 * Handles player game state, resources, and progression.
 * Encapsulates PlayerRepository and related services.
 */
import { Module } from '@nestjs/common';
import { PlayerRepository } from './infrastructure/persistence/player.repository';

@Module({
  providers: [PlayerRepository],
  exports: [PlayerRepository],
})
export class PlayersModule {}
