/**
 * TypeORM DataSource Configuration
 *
 * Used by TypeORM CLI for migrations.
 * Run migrations with: pnpm typeorm migration:run -d ./src/infrastructure/database/data-source.ts
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { UserEntity } from './entities/user.entity';
import { PlayerEntity } from './entities/player.entity';
import { ComputerEntity } from './entities/computer.entity';
import { DefenseEntity } from './entities/defense.entity';
import { HackOperationEntity } from './entities/hack-operation.entity';
import { ProgressionUnlockEntity } from './entities/progression-unlock.entity';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'netwatch_user',
  password: process.env.DB_PASSWORD || 'netwatch_dev_password',
  database: process.env.DB_NAME || 'netwatch_dev',
  entities: [
    UserEntity,
    PlayerEntity,
    ComputerEntity,
    DefenseEntity,
    HackOperationEntity,
    ProgressionUnlockEntity,
  ],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
