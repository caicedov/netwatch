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
import { InitiateHackUseCase } from '../application/usecases/initiate-hack.usecase';
import { InitiateHackDto, HackOperationDto } from '../application/dtos';
import { HackOperation } from '@netwatch/domain';

/**
 * Hacks Controller
 *
 * Handles hack operation endpoints:
 * - GET /hacks (list hacks)
 * - POST /hacks/:id/start (initiate hack)
 * - GET /hacks/:id (retrieve hack)
 *
 * All endpoints require JWT authentication.
 */
@Controller('hacks')
@UseGuards(JwtAuthGuard)
export class HacksController {
  constructor(private readonly initiateHackUseCase: InitiateHackUseCase) {}

  /**
   * List all hacks for player (own hacks and received attacks).
   *
   * @param request - Express request with user from JWT
   * @param status - Optional filter by status (pending, in_progress, succeeded, failed)
   * @returns Array of HackOperationDto
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listHacks(
    @Request() request: any,
    @Query('status') status?: string,
  ): Promise<HackOperationDto[]> {
    // TODO: Implement ListHacksUseCase with filtering
    throw new Error('Not implemented');
  }

  /**
   * Get specific hack operation details.
   *
   * @param id - Hack ID from URL
   * @returns HackOperationDto with hack state and result
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getHack(@Param('id') id: string): Promise<HackOperationDto> {
    // TODO: Implement GetHackUseCase
    throw new Error('Not implemented');
  }

  /**
   * Initiate hack against target computer.
   *
   * @param id - Target computer ID from URL
   * @param initiateHackDto - Hack payload (hackType, tools)
   * @param request - Express request with user from JWT
   * @returns HackOperationDto with hack status and estimated duration
   */
  @Post(':id/start')
  @HttpCode(HttpStatus.ACCEPTED) // 202 Accepted (async operation)
  @UsePipes(ValidationPipe)
  async initiateHack(
    @Param('id') id: string,
    @Body() initiateHackDto: InitiateHackDto,
    @Request() request: any,
  ): Promise<HackOperationDto> {
    const attackerId = request.user.userId;

    const hack = await this.initiateHackUseCase.execute(
      attackerId,
      id,
      initiateHackDto.hackType as any,
      initiateHackDto.tools,
    );

    return this.hackToDto(hack);
  }

  /**
   * Convert HackOperation domain entity to DTO.
   */
  private hackToDto(hack: HackOperation): HackOperationDto {
    return {
      hackId: hack.getId(),
      attackerId: hack.getAttackerId(),
      targetComputerId: hack.getTargetComputerId(),
      hackType: hack.getHackType(),
      status: hack.getStatus(),
      toolsUsed: hack.getToolsUsed(),
      estimatedDuration: hack.getEstimatedDuration(),
      startedAt: hack.getStartedAt(),
      completedAt: hack.getCompletionAt(),
      resultData: hack.getResultData(),
    };
  }
}
