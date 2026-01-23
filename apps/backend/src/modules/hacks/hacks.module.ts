/**
 * Hacks Module
 *
 * Handles hack operations and their execution.
 * Encapsulates HackOperationRepository and related services.
 */
import { Module } from '@nestjs/common';
import { HackOperationRepository } from './infrastructure/persistence/hack-operation.repository';

@Module({
  providers: [HackOperationRepository],
  exports: [HackOperationRepository],
})
export class HacksModule {}
