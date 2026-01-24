import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../modules/users/infrastructure/persistence/user.repository';

/**
 * JWT Strategy
 *
 * Validates JWT tokens and extracts user information.
 * Used by JwtAuthGuard to enforce protected endpoints.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    });
  }

  /**
   * Validate JWT payload and verify user still exists and is active.
   *
   * @param payload - Decoded JWT payload
   * @returns Object with userId and username for req.user
   * @throws UnauthorizedException if user not found or inactive
   */
  async validate(payload: any): Promise<any> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.getIsActive()) {
      throw new Error('User not found or inactive');
    }

    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
