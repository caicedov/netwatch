/**
 * User TypeORM Entity
 *
 * Maps User domain entity to PostgreSQL users table.
 */
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
@Index('idx_users_email', { synchronize: false })
@Index('idx_users_created', { synchronize: false })
export class UserEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  username!: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  password_hash!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  email!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  is_active!: boolean;

  @CreateDateColumn({
    type: 'timestamptz',
  })
  created_at!: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  last_login_at!: Date | null;
}
