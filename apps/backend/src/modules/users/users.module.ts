/**
 * Users Module
 *
 * Handles user authentication and account management.
 * Encapsulates:
 * - UserRepository (persistence)
 * - AuthService (business logic)
 * - PasswordService (password hashing)
 * - UsersController (HTTP endpoints)
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { AuthService } from './application/services/auth.service';
import { PasswordService } from './application/services/password.service';
import { UsersController } from './presentation/users.controller';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-prod',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [UserRepository, AuthService, PasswordService, JwtStrategy],
  controllers: [UsersController],
  exports: [UserRepository, AuthService, PasswordService],
})
export class UsersModule {}

