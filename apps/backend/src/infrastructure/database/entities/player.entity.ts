/**
 * Player TypeORM Entity
 *
 * Maps Player domain entity to PostgreSQL players table.
 * Level is a computed column: floor(sqrt(experience/100.0))
 */
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  Index,
  Generated,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('players')
@Index('idx_players_user', { synchronize: false })
@Index('idx_players_level', { synchronize: false })
@Index('idx_players_created', { synchronize: false })
export class PlayerEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
    unique: true,
  })
  user_id!: string;

  @OneToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({
    type: 'varchar',
    length: 50,
  })
  display_name!: string;

  @Column({
    type: 'integer',
    default: 100,
  })
  energy!: number;

  @Column({
    type: 'integer',
    default: 100,
  })
  energy_max!: number;

  @Column({
    type: 'bigint',
    default: 0,
  })
  money!: number;

  @Column({
    type: 'bigint',
    default: 0,
  })
  experience!: number;

  @Column({
    type: 'integer',
    generatedType: 'STORED',
    asExpression: `FLOOR(SQRT(CAST(experience AS NUMERIC) / 100.0))::INTEGER`,
  })
  level!: number;

  @Column({
    type: 'integer',
    default: 0,
  })
  skill_points!: number;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;
}
