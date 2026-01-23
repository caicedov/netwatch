/**
 * Users Module
 *
 * Handles user authentication and account management.
 * Encapsulates UserRepository and related services.
 */
import { Module } from '@nestjs/common';
import { UserRepository } from './infrastructure/persistence/user.repository';

@Module({
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UsersModule {}
