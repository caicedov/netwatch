/**
 * Progression Module
 *
 * Handles player progression unlocks (tools, upgrades, skills).
 * Encapsulates:
 * - ProgressionUnlockRepository (persistence)
 * - UnlockProgressionUseCase (unlock granting)
 * - ProgressionController (HTTP endpoints)
 */
import { Module } from '@nestjs/common';
import { ProgressionUnlockRepository } from './infrastructure/persistence/progression-unlock.repository';
import { UnlockProgressionUseCase } from './application/usecases/unlock-progression.usecase';
import { ProgressionController } from './presentation/progression.controller';
import { PlayersModule } from '../players/players.module';

@Module({
  imports: [PlayersModule],
  providers: [ProgressionUnlockRepository, UnlockProgressionUseCase],
  controllers: [ProgressionController],
  exports: [ProgressionUnlockRepository, UnlockProgressionUseCase],
})
export class ProgressionModule {}
