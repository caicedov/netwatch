import { IsEnum, IsArray, IsString, IsUUID } from 'class-validator';

export enum HackTypeEnum {
  BRUTEFORCE = 'bruteforce',
  SQLINJECTION = 'sqlinjection',
  PHISHING = 'phishing',
  TROJAN = 'trojan',
}

/**
 * Initiate Hack DTO
 *
 * Payload for starting a hack operation.
 * Now includes targetComputerId in body (moved from URL param).
 */
export class InitiateHackDto {
  @IsUUID()
  targetComputerId!: string;

  @IsEnum(HackTypeEnum)
  hackType!: HackTypeEnum;

  @IsArray()
  @IsString({ each: true })
  tools!: string[];
}
