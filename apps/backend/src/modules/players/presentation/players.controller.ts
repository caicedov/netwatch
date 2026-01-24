import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreatePlayerUseCase } from '../application/usecases/create-player.usecase';
import { GetPlayerProfileUseCase } from '../application/usecases/get-player-profile.usecase';
import { CreatePlayerDto, PlayerDto } from '../application/dtos';
import { Player } from '@netwatch/domain';

/**
 * Players Controller
 *
 * Handles player management endpoints:
 * - POST /players (create)
 * - GET /players/:playerId (retrieve)
 *
 * All endpoints require JWT authentication.
 */
@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(
    private readonly createPlayerUseCase: CreatePlayerUseCase,
    private readonly getPlayerProfileUseCase: GetPlayerProfileUseCase,
  ) {}

  /**
   * Create a new player for authenticated user.
   *
   * @param request - Express request with user from JWT
   * @returns PlayerDto with player info and initial resources
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async createPlayer(@Request() request: any): Promise<PlayerDto> {
    const userId = request.user.userId;
    const username = request.user.username;

    const player = await this.createPlayerUseCase.execute(userId, username);

    return this.playerToDto(player);
  }

  /**
   * Get player profile (own profile only).
   *
   * @param playerId - Player ID from URL
   * @param request - Express request with user from JWT
   * @returns PlayerDto with full player state
   */
  @Get(':playerId')
  @HttpCode(HttpStatus.OK)
  async getPlayer(
    @Param('playerId') playerId: string,
    @Request() request: any,
  ): Promise<PlayerDto> {
    const userId = request.user.userId;

    const player = await this.getPlayerProfileUseCase.execute(playerId, userId);

    return this.playerToDto(player);
  }

  /**
   * Convert Player domain entity to DTO.
   */
  private playerToDto(player: Player): PlayerDto {
    return {
      playerId: player.getId(),
      username: player.getDisplayName(),
      level: player.getLevel(),
      experience: Number(player.getExperience()),
      money: player.getMoney().getValue(),
      energy: player.getEnergy().getCurrent(),
      energyMax: player.getEnergy().getMax(),
      skillPoints: player.getSkillPoints(),
      createdAt: player.getCreatedAt(),
    };
  }
}
