/**
 * Create Player DTO
 *
 * Payload for player creation endpoint.
 * Username is inherited from user registration.
 */
export class CreatePlayerDto {
  userId!: string; // Extracted from JWT context
}
