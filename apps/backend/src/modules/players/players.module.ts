/**
 * Players Module
 *
 * Handles player game state, resources, and progression.
 * Encapsulates:
 * - PlayerRepository (persistence)
 * - CreatePlayerUseCase (player creation)
 * - GetPlayerProfileUseCase (player retrieval)
 * - PlayersController (HTTP endpoints)
 */
import { Module } from '@nestjs/common';
import { PlayerRepository } from './infrastructure/persistence/player.repository';
import { CreatePlayerUseCase } from './application/usecases/create-player.usecase';
import { GetPlayerProfileUseCase } from './application/usecases/get-player-profile.usecase';
import { PlayersController } from './presentation/players.controller';

@Module({
  providers: [PlayerRepository, CreatePlayerUseCase, GetPlayerProfileUseCase],
  controllers: [PlayersController],
  exports: [PlayerRepository, CreatePlayerUseCase, GetPlayerProfileUseCase],
})
export class PlayersModule {}

