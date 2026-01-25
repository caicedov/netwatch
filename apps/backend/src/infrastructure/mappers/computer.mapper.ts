/**
 * Computer Mapper
 *
 * Maps between Prisma Computer model and domain Computer entity.
 * Enforces domain invariants during reconstruction.
 */
import { Computer, createComputerId } from '@netwatch/domain';
import type { Computer as PrismaComputer } from '@prisma/client';

export class ComputerMapper {
  static toDomain(raw: PrismaComputer): Computer {
    return Computer.fromPersistence(
      createComputerId(raw.id),
      raw.ownerId,
      raw.name,
      raw.ipAddress,
      raw.createdAt,
      raw.storage,
      raw.cpu,
      raw.memory,
      raw.isOnline,
      raw.firewallLevel,
    );
  }

  static toPersistence(computer: Computer) {
    return {
      id: computer.getId(),
      ownerId: computer.getOwnerId(),
      name: computer.getName(),
      ipAddress: computer.getIpAddress(),
      storage: computer.getStorage(),
      cpu: computer.getCpu(),
      memory: computer.getMemory(),
      isOnline: computer.getIsOnline(),
      firewallLevel: computer.getFirewallLevel(),
      createdAt: computer.getCreatedAt(),
    };
  }
}
