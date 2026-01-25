/**
 * HackOperation Repository
 *
 * Encapsulates all database access for HackOperation aggregate.
 * Private to the hacks module.
 */
import { Injectable } from '@nestjs/common';
import { HackOperation } from '@netwatch/domain';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { HackOperationMapper } from '../../../../infrastructure/mappers/hack-operation.mapper';
import { HackStatus } from '@prisma/client';

@Injectable()
export class HackOperationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<HackOperation | null> {
    const raw = await this.prisma.hackOperation.findUnique({
      where: { id },
      include: {
        attacker: true,
        targetComputer: true,
      },
    });
    return raw ? HackOperationMapper.toDomain(raw) : null;
  }

  async findByAttackerId(attackerId: string): Promise<HackOperation[]> {
    const raw = await this.prisma.hackOperation.findMany({
      where: { attackerId },
      orderBy: { startedAt: 'desc' },
      include: {
        attacker: true,
        targetComputer: true,
      },
    });
    return raw.map((r) => HackOperationMapper.toDomain(r));
  }

  async findByAttackerIdAndStatus(
    attackerId: string,
    status: string,
  ): Promise<HackOperation[]> {
    const raw = await this.prisma.hackOperation.findMany({
      where: {
        attackerId,
        status: status as HackStatus,
      },
      include: {
        attacker: true,
        targetComputer: true,
      },
    });
    return raw.map((r) => HackOperationMapper.toDomain(r));
  }

  async findByTargetComputerId(targetComputerId: string): Promise<HackOperation[]> {
    const raw = await this.prisma.hackOperation.findMany({
      where: { targetComputerId },
      orderBy: { startedAt: 'desc' },
      include: {
        attacker: true,
        targetComputer: true,
      },
    });
    return raw.map((r) => HackOperationMapper.toDomain(r));
  }

  async findPendingCompletions(): Promise<HackOperation[]> {
    const raw = await this.prisma.hackOperation.findMany({
      where: {
        status: HackStatus.IN_PROGRESS,
        completionAt: {
          lte: new Date(),
        },
      },
    });
    return raw.map((r) => HackOperationMapper.toDomain(r));
  }

  async create(operation: HackOperation): Promise<HackOperation> {
    const raw = await this.prisma.hackOperation.create({
      data: HackOperationMapper.toPersistence(operation),
    });
    return HackOperationMapper.toDomain(raw);
  }

  async update(operation: HackOperation): Promise<HackOperation> {
    const raw = await this.prisma.hackOperation.update({
      where: { id: operation.getId() },
      data: HackOperationMapper.toPersistence(operation),
      include: {
        attacker: true,
        targetComputer: true,
      },
    });
    return HackOperationMapper.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.hackOperation.delete({
      where: { id },
    });
  }

  async countActiveHacksByAttacker(attackerId: string): Promise<number> {
    return this.prisma.hackOperation.count({
      where: {
        attackerId,
        status: HackStatus.IN_PROGRESS,
      },
    });
  }

  async countActiveHacksOnTarget(targetComputerId: string): Promise<number> {
    return this.prisma.hackOperation.count({
      where: {
        targetComputerId,
        status: HackStatus.IN_PROGRESS,
      },
    });
  }
}
