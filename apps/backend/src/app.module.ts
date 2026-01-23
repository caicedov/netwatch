/**
 * App Module
 *
 * Root NestJS module that imports all feature modules.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { PlayersModule } from './modules/players/players.module';
import { ComputersModule } from './modules/computers/computers.module';
import { HacksModule } from './modules/hacks/hacks.module';
import { ProgressionModule } from './modules/progression/progression.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Infrastructure
    DatabaseModule,

    // Feature modules
    UsersModule,
    PlayersModule,
    ComputersModule,
    HacksModule,
    ProgressionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
