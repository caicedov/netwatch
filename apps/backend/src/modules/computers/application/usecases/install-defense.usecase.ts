import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Defense, DefenseId, DefenseType, createDefenseId } from '@netwatch/domain';
import { DefenseRepository } from '../../infrastructure/persistence/defense.repository';
import { ComputerRepository } from '../../infrastructure/persistence/computer.repository';
import { v4 as uuid } from 'uuid';

/**
 * Install Defense Use Case
 *
 * Installs a defense mechanism on a computer.
 * - Validates computer ownership
 * - Enforces defense type and level constraints
 * - Stores defense in persistent layer
 */
@Injectable()
export class InstallDefenseUseCase {
  constructor(
    private readonly defenseRepository: DefenseRepository,
    private readonly computerRepository: ComputerRepository,
  ) {}

  /**
   * Execute defense installation.
   *
   * @param computerId - ID of computer to protect
   * @param defenseType - Type of defense (firewall, antivirus, honeypot, ids)
   * @param requestingUserId - ID of user making request (for authorization)
   * @returns Promise<Defense> the installed defense
   * @throws NotFoundException if computer not found
   * @throws ForbiddenException if user not owner
   */
  async execute(
    computerId: string,
    defenseType: DefenseType,
    requestingUserId: string,
  ): Promise<Defense> {
    // Verify computer exists and user owns it
    const computer = await this.computerRepository.findById(computerId);
    if (!computer) {
      throw new NotFoundException(`Computer ${computerId} not found`);
    }

    if (computer.getOwnerId() !== requestingUserId) {
      throw new Error('Unauthorized: cannot install defense on others computer');
    }

    // Create defense aggregate (level starts at 1)
    const defenseId = createDefenseId(uuid());
    const defense = Defense.create(
      defenseId,
      computerId,
      defenseType,
    );

    // Persist to repository
    return await this.defenseRepository.create(defense);
  }
}
