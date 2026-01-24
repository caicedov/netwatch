import { IsEnum, IsArray, IsString } from 'class-validator';

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
 */
export class InitiateHackDto {
  @IsEnum(HackTypeEnum)
  hackType!: HackTypeEnum;

  @IsArray()
  @IsString({ each: true })
  tools!: string[];
}
