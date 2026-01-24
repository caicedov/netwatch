/**
 * Defense Response DTO
 *
 * Public representation of an installed defense.
 */
export class DefenseDto {
  defenseId!: string;
  computerId!: string;
  type!: string;
  level!: number;
  createdAt!: Date;
}
