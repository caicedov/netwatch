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
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreatePlayerUseCase } from '../application/usecases/create-player.usecase';
import { GetPlayerProfileUseCase } from '../application/usecases/get-player-profile.usecase';
import { CreatePlayerDto, PlayerDto } from '../application/dtos';
import { Player } from '@netwatch/domain';
import { CreateComputerUseCase } from '../../computers/application/usecases/create-computer.usecase';
import { CreateComputerDto, ComputerDto } from '../../computers/application/dtos';
import { Computer } from '@netwatch/domain';

/**
 * Players Controller
 *
 * Handles player management endpoints:
 * - POST /players (create)
 * - GET /players/:playerId (retrieve)
 * - POST /players/:playerId/computers (create computer)
 * - GET /players/:playerId/computers (list computers)
 * - GET /players/:playerId/hacks (list hacks)
 * - GET /players/:playerId/unlocks (list unlocks)
 * - GET /players/:playerId/unlocks/:unlockKey (check unlock)
 *
 * All endpoints require JWT authentication.
 */
@Controller('players')
@UseGuards(JwtAuthGuard)
export class PlayersController {
  constructor(
    private readonly createPlayerUseCase: CreatePlayerUseCase,
    private readonly getPlayerProfileUseCase: GetPlayerProfileUseCase,
    private readonly createComputerUseCase: CreateComputerUseCase,
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
   * Create a new computer for player (now under /players/:playerId/computers).
   *
   * @param playerId - Player ID from URL
   * @param createComputerDto - Computer creation payload (name)
   * @param request - Express request with user from JWT
   * @returns ComputerDto with computer info
   */
  @Post(':playerId/computers')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async createComputer(
    @Param('playerId') playerId: string,
    @Body() createComputerDto: CreateComputerDto,
    @Request() request: any,
  ): Promise<ComputerDto> {
    const userId = request.user.userId;

    const computer = await this.createComputerUseCase.execute(playerId, createComputerDto.name);

    return this.computerToDto(computer);
  }

  /**
   * List computers owned by player.
   *
   * @param playerId - Player ID from URL
   * @returns Array of ComputerDto
   */
  @Get(':playerId/computers')
  @HttpCode(HttpStatus.OK)
  async listComputers(@Param('playerId') playerId: string): Promise<ComputerDto[]> {
    // TODO: Implement ListComputersUseCase
    throw new Error('Not implemented');
  }

  /**
   * List hacks involving player (attacker or defender).
   *
   * @param playerId - Player ID from URL
   * @param role - Optional filter: 'attacker' or 'defender'
   * @returns Array of HackOperationDto
   */
  @Get(':playerId/hacks')
  @HttpCode(HttpStatus.OK)
  async listHacks(
    @Param('playerId') playerId: string,
    @Query('role') role?: 'attacker' | 'defender',
  ): Promise<any[]> {
    // TODO: Implement ListPlayerHacksUseCase with role filtering
    throw new Error('Not implemented');
  }

  /**
   * List player's progression unlocks.
   *
   * @param playerId - Player ID from URL
   * @returns Array of ProgressionUnlockDto
   */
  @Get(':playerId/unlocks')
  @HttpCode(HttpStatus.OK)
  async listUnlocks(@Param('playerId') playerId: string): Promise<any[]> {
    // TODO: Implement ListUnlocksUseCase
    throw new Error('Not implemented');
  }

  /**
   * Check if player has specific unlock.
   *
   * @param playerId - Player ID from URL
   * @param unlockKey - Unlock key to check
   * @returns { hasUnlock: boolean, unlockedAt: ISO8601 | null }
   */
  @Get(':playerId/unlocks/:unlockKey')
  @HttpCode(HttpStatus.OK)
  async checkUnlock(
    @Param('playerId') playerId: string,
    @Param('unlockKey') unlockKey: string,
  ): Promise<{ hasUnlock: boolean; unlockedAt: string | null }> {
    // TODO: Implement CheckUnlockUseCase
    throw new Error('Not implemented');
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
      energy: {
        current: player.getEnergy().getCurrent(),
        max: player.getEnergy().getMax(),
      },
      skillPoints: player.getSkillPoints(),
      createdAt: player.getCreatedAt(),
    };
  }

  /**
   * Convert Computer domain entity to DTO.
   */
  private computerToDto(computer: Computer): ComputerDto {
    return {
      computerId: computer.getId(),
      ownerId: computer.getOwnerId(),
      name: computer.getName(),
      ipAddress: computer.getIpAddress(),
      storage: computer.getStorage(),
      cpu: computer.getCpu(),
      memory: computer.getMemory(),
      isOnline: computer.getIsOnline(),
      firewallLevel: computer.getFirewallLevel(),
      createdAt: computer.getCreatedAt(),
    };
  }
}
