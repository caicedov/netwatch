/**
 * Computer TypeORM Entity
 *
 * Maps Computer domain entity to PostgreSQL computers table.
 */
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { PlayerEntity } from './player.entity';
import { DefenseEntity } from './defense.entity';

@Entity('computers')
@Index('idx_computers_owner', { synchronize: false })
@Index('idx_computers_ip', { synchronize: false })
@Index('idx_computers_online', { synchronize: false })
export class ComputerEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
  })
  owner_id!: string;

  @ManyToOne(() => PlayerEntity, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'owner_id' })
  owner?: PlayerEntity;

  @OneToMany(() => DefenseEntity, (defense) => defense.computer, {
    eager: false,
  })
  defenses?: DefenseEntity[];

  @Column({
    type: 'varchar',
    length: 50,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 15,
    unique: true,
  })
  ip_address!: string;

  @Column({
    type: 'integer',
    default: 1000,
  })
  storage!: number;

  @Column({
    type: 'integer',
    default: 100,
  })
  cpu!: number;

  @Column({
    type: 'integer',
    default: 512,
  })
  memory!: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_online!: boolean;

  @Column({
    type: 'integer',
    default: 0,
  })
  firewall_level!: number;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;
}
