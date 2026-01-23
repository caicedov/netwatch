/**
 * Computer Mapper
 *
 * Maps between TypeORM ComputerEntity and domain Computer entity.
 * Enforces domain invariants during reconstruction.
 */
import { Computer, createComputerId } from '@netwatch/domain';
import { type ComputerEntity } from '../database/entities/computer.entity';

export class ComputerMapper {
  static toDomain(raw: ComputerEntity): Computer {
    return Computer.fromPersistence(
      createComputerId(raw.id),
      raw.owner_id,
      raw.name,
      raw.ip_address,
      raw.created_at,
      raw.storage,
      raw.cpu,
      raw.memory,
      raw.is_online,
      raw.firewall_level,
    );
  }

  static toPersistence(computer: Computer): Partial<ComputerEntity> {
    return {
      id: computer.getId(),
      owner_id: computer.getOwnerId(),
      name: computer.getName(),
      ip_address: computer.getIpAddress(),
      storage: computer.getStorage(),
      cpu: computer.getCpu(),
      memory: computer.getMemory(),
      is_online: computer.getIsOnline(),
      firewall_level: computer.getFirewallLevel(),
      created_at: computer.getCreatedAt(),
    };
  }
}
