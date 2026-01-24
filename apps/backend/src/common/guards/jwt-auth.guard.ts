import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard
 *
 * Enforces JWT authentication on protected endpoints.
 * Extracted from Authorization header as Bearer token.
 * If token invalid/missing, returns 401 Unauthorized.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
