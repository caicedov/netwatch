import { IsEnum } from 'class-validator';

export enum DefenseTypeEnum {
  FIREWALL = 'firewall',
  ANTIVIRUS = 'antivirus',
  HONEYPOT = 'honeypot',
  IDS = 'ids',
}

/**
 * Install Defense DTO
 *
 * Payload for installing defense on a computer.
 * Defense starts at level 1 by default.
 */
export class InstallDefenseDto {
  @IsEnum(DefenseTypeEnum)
  defenseType!: DefenseTypeEnum;
}
