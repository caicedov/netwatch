/**
 * ProgressionUnlock TypeORM Entity
 *
 * Maps ProgressionUnlock domain entity to PostgreSQL progression_unlocks table.
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

export enum UnlockTypeEnum {
  TOOL = 'tool',
  DEFENSE = 'defense',
  UPGRADE = 'upgrade',
  SKILL = 'skill',
}

@Entity('progression_unlocks')
@Index('idx_unlocks_player', { synchronize: false })
@Index('idx_unlocks_key', { synchronize: false })
export class ProgressionUnlockEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
  })
  player_id!: string;

  @ManyToOne(() => PlayerEntity, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'player_id' })
  player?: PlayerEntity;

  @Column({
    type: 'enum',
    enum: UnlockTypeEnum,
  })
  unlock_type!: UnlockTypeEnum;

  @Column({
    type: 'varchar',
    length: 50,
  })
  unlock_key!: string;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  unlocked_at!: Date;
}
