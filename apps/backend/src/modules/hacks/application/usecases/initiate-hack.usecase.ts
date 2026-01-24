import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { HackOperation, HackOperationId, HackType, createHackOperationId } from '@netwatch/domain';
import { HackOperationRepository } from '../../infrastructure/persistence/hack-operation.repository';
import { PlayerRepository } from '../../../players/infrastructure/persistence/player.repository';
import { ComputerRepository } from '../../../computers/infrastructure/persistence/computer.repository';
import { v4 as uuid } from 'uuid';

/**
 * Initiate Hack Use Case
 *
 * Starts a hack operation against a target computer.
 * - Validates attacker and target exist
 * - Prevents self-hacking (server-authoritative rule)
 * - Creates HackOperation aggregate
 * - Returns status with estimated duration
 */
@Injectable()
export class InitiateHackUseCase {
  constructor(
    private readonly hackOperationRepository: HackOperationRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly computerRepository: ComputerRepository,
  ) {}

  /**
   * Execute hack initiation.
   *
   * @param attackerId - ID of attacking player
   * @param targetComputerId - ID of computer to hack
   * @param hackType - Type of hack (bruteforce, sqlinjection, etc.)
   * @param tools - Array of tools used in attack
   * @returns Promise<HackOperation> the created hack operation
   * @throws ForbiddenException if cannot hack target
   * @throws NotFoundException if attacker or target not found
   */
  async execute(
    attackerId: string,
    targetComputerId: string,
    hackType: HackType,
    tools: string[],
  ): Promise<HackOperation> {
    // Verify attacker exists
    const attacker = await this.playerRepository.findById(attackerId);
    if (!attacker) {
      throw new NotFoundException(`Attacker ${attackerId} not found`);
    }

    // Verify target computer exists
    const targetComputer = await this.computerRepository.findById(targetComputerId);
    if (!targetComputer) {
      throw new NotFoundException(`Target computer ${targetComputerId} not found`);
    }

    // Load target owner
    const targetOwner = await this.playerRepository.findById(targetComputer.getOwnerId());
    if (!targetOwner) {
      throw new NotFoundException(`Target owner not found`);
    }

    // Server-authoritative: prevent self-hacking
    if (attacker.getId() === targetOwner.getId()) {
      throw new ForbiddenException('Cannot hack your own computer');
    }

    // Create hack operation aggregate (domain invariants enforced)
    const hackId = createHackOperationId(uuid());
    const hack = HackOperation.create(
      hackId,
      attackerId,
      targetComputerId,
      hackType,
      tools,
      300, // 5 minutes estimated duration
    );

    // Persist to repository
    return await this.hackOperationRepository.create(hack);
  }
}
