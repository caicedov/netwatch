/**
 * Progression Module
 *
 * Handles player progression unlocks (tools, upgrades, skills).
 * Encapsulates ProgressionUnlockRepository and related services.
 */
import { Module } from '@nestjs/common';
import { ProgressionUnlockRepository } from './infrastructure/persistence/progression-unlock.repository';

@Module({
  providers: [ProgressionUnlockRepository],
  exports: [ProgressionUnlockRepository],
})
export class ProgressionModule {}
