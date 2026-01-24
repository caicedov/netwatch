/**
 * Computers Module
 *
 * Handles computer management, defenses, and IP address generation.
 * Encapsulates:
 * - ComputerRepository (persistence)
 * - DefenseRepository (persistence)
 * - CreateComputerUseCase (computer creation)
 * - InstallDefenseUseCase (defense installation)
 * - IPAddressService (IP generation)
 * - ComputersController (HTTP endpoints)
 */
import { Module } from '@nestjs/common';
import { ComputerRepository } from './infrastructure/persistence/computer.repository';
import { DefenseRepository } from './infrastructure/persistence/defense.repository';
import { CreateComputerUseCase } from './application/usecases/create-computer.usecase';
import { InstallDefenseUseCase } from './application/usecases/install-defense.usecase';
import { IPAddressService } from './application/services/ip-address.service';
import { ComputersController } from './presentation/computers.controller';

@Module({
  providers: [
    ComputerRepository,
    DefenseRepository,
    CreateComputerUseCase,
    InstallDefenseUseCase,
    IPAddressService,
  ],
  controllers: [ComputersController],
  exports: [
    ComputerRepository,
    DefenseRepository,
    CreateComputerUseCase,
    InstallDefenseUseCase,
    IPAddressService,
  ],
})
export class ComputersModule {}
