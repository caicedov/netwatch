/**
 * Computer Response DTO
 *
 * Public representation of a computer.
 */
export class ComputerDto {
  computerId!: string;
  ownerId!: string;
  name!: string;
  ipAddress!: string;
  storage!: number;
  cpu!: number;
  memory!: number;
  isOnline!: boolean;
  firewallLevel!: number;
  createdAt!: Date;
}
