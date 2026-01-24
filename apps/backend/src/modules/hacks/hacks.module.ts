/**
 * Hacks Module
 *
 * Handles hack operations and their execution.
 * Encapsulates:
 * - HackOperationRepository (persistence)
 * - InitiateHackUseCase (hack creation)
 * - HacksController (HTTP endpoints)
 */
import { Module } from '@nestjs/common';
import { HackOperationRepository } from './infrastructure/persistence/hack-operation.repository';
import { InitiateHackUseCase } from './application/usecases/initiate-hack.usecase';
import { HacksController } from './presentation/hacks.controller';
import { PlayersModule } from '../players/players.module';
import { ComputersModule } from '../computers/computers.module';

@Module({
  imports: [PlayersModule, ComputersModule],
  providers: [HackOperationRepository, InitiateHackUseCase],
  controllers: [HacksController],
  exports: [HackOperationRepository, InitiateHackUseCase],
})
export class HacksModule {}
