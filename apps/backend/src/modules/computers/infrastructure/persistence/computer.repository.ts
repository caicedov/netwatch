/**
 * Computer Repository
 *
 * Encapsulates all database access for Computer aggregate.
 * Private to the computers module.
 */
import { Injectable } from '@nestjs/common';
import { Computer } from '@netwatch/domain';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { ComputerMapper } from '../../../../infrastructure/mappers/computer.mapper';

@Injectable()
export class ComputerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Computer | null> {
    const raw = await this.prisma.computer.findUnique({
      where: { id },
      include: { defenses: true },
    });
    return raw ? ComputerMapper.toDomain(raw) : null;
  }

  async findByIpAddress(ipAddress: string): Promise<Computer | null> {
    const raw = await this.prisma.computer.findUnique({
      where: { ipAddress },
      include: { defenses: true },
    });
    return raw ? ComputerMapper.toDomain(raw) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Computer[]> {
    const raw = await this.prisma.computer.findMany({
      where: { ownerId },
      include: { defenses: true },
    });
    return raw.map((r) => ComputerMapper.toDomain(r));
  }

  async findOnlineComputersExcept(ownerIds: string[]): Promise<Computer[]> {
    const raw = await this.prisma.computer.findMany({
      where: {
        isOnline: true,
        ownerId: {
          notIn: ownerIds,
        },
      },
      include: { defenses: true },
    });
    return raw.map((r) => ComputerMapper.toDomain(r));
  }

  async create(computer: Computer): Promise<Computer> {
    const raw = await this.prisma.computer.create({
      data: ComputerMapper.toPersistence(computer),
      include: { defenses: true },
    });
    return ComputerMapper.toDomain(raw);
  }

  async update(computer: Computer): Promise<Computer> {
    const raw = await this.prisma.computer.update({
      where: { id: computer.getId() },
      data: ComputerMapper.toPersistence(computer),
      include: { defenses: true },
    });
    return ComputerMapper.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.computer.delete({
      where: { id },
    });
  }

  async existsWithIpAddress(ipAddress: string): Promise<boolean> {
    const count = await this.prisma.computer.count({
      where: { ipAddress },
    });
    return count > 0;
  }

  async countByOwnerId(ownerId: string): Promise<number> {
    return this.prisma.computer.count({
      where: { ownerId },
    });
  }
}
