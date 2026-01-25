/**
 * Database Connection Module
 *
 * Provides shared PostgreSQL connection for all repositories.
 * Uses Prisma Client for connection pooling and query execution.
 */
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
