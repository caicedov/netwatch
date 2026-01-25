/**
 * Player Response DTO
 *
 * Public representation of player state.
 * Shows resources, progression, and level (computed).
 */
export class PlayerDto {
  playerId!: string;
  username!: string;
  level!: number;
  experience!: number;
  money!: bigint;
  energy!: {
    current: number;
    max: number;
  };
  skillPoints!: number;
  createdAt!: Date;
}
