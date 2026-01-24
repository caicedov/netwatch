import { IsEnum, IsString, Length } from 'class-validator';

export enum UnlockTypeEnum {
  TOOL = 'tool',
  DEFENSE = 'defense',
  UPGRADE = 'upgrade',
  SKILL = 'skill',
}

/**
 * Unlock Progression DTO
 *
 * Payload for unlocking progression items.
 */
export class UnlockProgressionDto {
  @IsEnum(UnlockTypeEnum)
  unlockType!: UnlockTypeEnum;

  @IsString()
  @Length(1, 50)
  unlockKey!: string;
}
