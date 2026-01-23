/**
 * Database Connection Module
 *
 * Provides shared PostgreSQL connection for all repositories.
 * Uses TypeORM DataSource for connection pooling and transaction management.
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { PlayerEntity } from './entities/player.entity';
import { ComputerEntity } from './entities/computer.entity';
import { DefenseEntity } from './entities/defense.entity';
import { HackOperationEntity } from './entities/hack-operation.entity';
import { ProgressionUnlockEntity } from './entities/progression-unlock.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USERNAME') || 'netwatch_user',
          password: configService.get<string>('DB_PASSWORD') || 'netwatch_dev_password',
          database: configService.get<string>('DB_NAME') || 'netwatch_dev',
          entities: [
            UserEntity,
            PlayerEntity,
            ComputerEntity,
            DefenseEntity,
            HackOperationEntity,
            ProgressionUnlockEntity,
          ],
          migrations: [__dirname + '/migrations/*.ts'],
          migrationsRun: false, // Run migrations manually
          synchronize: false, // NEVER use in production, use migrations
          logging: process.env.NODE_ENV === 'development',
          ssl: isProduction ? { rejectUnauthorized: false } : false,
          extra: {
            max: 20,
            min: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
