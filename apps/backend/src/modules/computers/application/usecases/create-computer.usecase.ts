import { Injectable, NotFoundException } from '@nestjs/common';
import { Computer, ComputerId, createComputerId } from '@netwatch/domain';
import { ComputerRepository } from '../../infrastructure/persistence/computer.repository';
import { IPAddressService } from '../services/ip-address.service';
import { v4 as uuid } from 'uuid';

/**
 * Create Computer Use Case
 *
 * Creates a new computer owned by a player.
 * - Generates unique IP address
 * - Initializes with default resources (1000 storage, 100 CPU, 512 memory)
 * - Sets online to true by default
 */
@Injectable()
export class CreateComputerUseCase {
  constructor(
    private readonly computerRepository: ComputerRepository,
    private readonly ipAddressService: IPAddressService,
  ) {}

  /**
   * Execute computer creation.
   *
   * @param playerId - ID of owning player
   * @param computerName - Friendly name for computer
   * @returns Promise<Computer> the created computer
   */
  async execute(playerId: string, computerName: string): Promise<Computer> {
    // Generate unique IP address
    const ipAddress = await this.ipAddressService.generateUniqueIP();

    // Create computer aggregate
    const computerId = createComputerId(uuid());
    const computer = Computer.create(computerId, playerId, computerName, ipAddress);

    // Persist to repository
    return await this.computerRepository.create(computer);
  }
}
