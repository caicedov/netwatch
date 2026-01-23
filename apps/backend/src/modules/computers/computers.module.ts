/**
 * Computers Module
 *
 * Handles virtual computer systems and their defenses.
 * Encapsulates ComputerRepository and DefenseRepository.
 */
import { Module } from '@nestjs/common';
import { ComputerRepository } from './infrastructure/persistence/computer.repository';
import { DefenseRepository } from './infrastructure/persistence/defense.repository';

@Module({
  providers: [ComputerRepository, DefenseRepository],
  exports: [ComputerRepository, DefenseRepository],
})
export class ComputersModule {}
