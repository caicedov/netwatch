/**
 * Defense TypeORM Entity
 *
 * Maps Defense domain entity to PostgreSQL defenses table.
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
import { ComputerEntity } from './computer.entity';

export enum DefenseTypeEnum {
  FIREWALL = 'firewall',
  ANTIVIRUS = 'antivirus',
  HONEYPOT = 'honeypot',
  IDS = 'ids',
}

@Entity('defenses')
@Index('idx_defenses_computer', { synchronize: false })
@Index('unique_defense_per_computer', { synchronize: false })
export class DefenseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
  })
  computer_id!: string;

  @ManyToOne(() => ComputerEntity, (computer) => computer.defenses, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'computer_id' })
  computer?: ComputerEntity;

  @Column({
    type: 'enum',
    enum: DefenseTypeEnum,
  })
  defense_type!: DefenseTypeEnum;

  @Column({
    type: 'integer',
    default: 1,
  })
  level!: number;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  installed_at!: Date;
}
