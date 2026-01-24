/**
 * Hack Operation Response DTO
 *
 * Public representation of a hack operation.
 */
export class HackOperationDto {
  hackId!: string;
  attackerId!: string;
  targetComputerId!: string;
  hackType!: string;
  status!: string;
  toolsUsed!: string[];
  estimatedDuration!: number;
  startedAt!: Date;
  completedAt!: Date | null;
  resultData!: Record<string, any>;
}
