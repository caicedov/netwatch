/**
 * HackOperation TypeORM Entity
 *
 * Maps HackOperation domain entity to PostgreSQL hack_operations table.
 */
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlayerEntity } from './player.entity';
import { ComputerEntity } from './computer.entity';

export enum HackStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  ABORTED = 'aborted',
}

export enum HackTypeEnum {
  STEAL_MONEY = 'steal_money',
  STEAL_DATA = 'steal_data',
  INSTALL_VIRUS = 'install_virus',
  DDOS = 'ddos',
}

@Entity('hack_operations')
@Index('idx_hack_attacker', { synchronize: false })
@Index('idx_hack_target', { synchronize: false })
@Index('idx_hack_status', { synchronize: false })
@Index('idx_hack_pending', { synchronize: false })
@Index('idx_hack_tools', { synchronize: false })
export class HackOperationEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
  })
  attacker_id!: string;

  @ManyToOne(() => PlayerEntity, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'attacker_id' })
  attacker?: PlayerEntity;

  @Column({
    type: 'uuid',
  })
  target_computer_id!: string;

  @ManyToOne(() => ComputerEntity, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'target_computer_id' })
  targetComputer?: ComputerEntity;

  @Column({
    type: 'enum',
    enum: HackStatusEnum,
    default: HackStatusEnum.PENDING,
  })
  status!: HackStatusEnum;

  @Column({
    type: 'enum',
    enum: HackTypeEnum,
  })
  hack_type!: HackTypeEnum;

  @Column({
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  tools_used!: string[];

  @Column({
    type: 'integer',
  })
  estimated_duration!: number;

  @Column({
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  started_at!: Date;

  @Column({
    type: 'timestamptz',
  })
  completion_at!: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  result_data!: Record<string, unknown> | null;
}
