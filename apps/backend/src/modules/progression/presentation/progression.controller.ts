import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UnlockProgressionUseCase } from '../application/usecases/unlock-progression.usecase';
import { UnlockProgressionDto, ProgressionUnlockDto } from '../application/dtos';
import { ProgressionUnlock } from '@netwatch/domain';

/**
 * Progression Controller
 *
 * Handles progression/unlock endpoints:
 * - POST /progression/unlocks (unlock progression item)
 *
 * All endpoints require JWT authentication.
 */
@Controller('progression')
@UseGuards(JwtAuthGuard)
export class ProgressionController {
  constructor(private readonly unlockProgressionUseCase: UnlockProgressionUseCase) {}

  /**
   * Unlock a progression item (tool, defense, upgrade, skill).
   *
   * @param unlockProgressionDto - Unlock payload (unlockType, unlockKey)
   * @param request - Express request with user from JWT
   * @returns ProgressionUnlockDto with unlock info
   */
  @Post('unlocks')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async unlockProgression(
    @Body() unlockProgressionDto: UnlockProgressionDto,
    @Request() request: any,
  ): Promise<ProgressionUnlockDto> {
    const playerId = request.user.userId;

    const unlock = await this.unlockProgressionUseCase.execute(
      playerId,
      unlockProgressionDto.unlockType as any,
      unlockProgressionDto.unlockKey,
    );

    return this.progressionUnlockToDto(unlock);
  }

  /**
   * Convert ProgressionUnlock domain entity to DTO.
   */
  private progressionUnlockToDto(unlock: ProgressionUnlock): ProgressionUnlockDto {
    return {
      unlockId: unlock.getId(),
      playerId: unlock.getPlayerId(),
      unlockType: unlock.getUnlockType(),
      unlockKey: unlock.getUnlockKey(),
      unlockedAt: unlock.getUnlockedAt(),
    };
  }
}
