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
import { CreateComputerUseCase } from '../application/usecases/create-computer.usecase';
import { InstallDefenseUseCase } from '../application/usecases/install-defense.usecase';
import { CreateComputerDto, ComputerDto, InstallDefenseDto, DefenseDto } from '../application/dtos';
import { Computer, Defense } from '@netwatch/domain';

/**
 * Computers Controller
 *
 * Handles computer management endpoints:
 * - POST /computers (create)
 * - GET /computers/:id (retrieve)
 * - POST /computers/:id/defenses (install defense)
 *
 * All endpoints require JWT authentication.
 */
@Controller('computers')
@UseGuards(JwtAuthGuard)
export class ComputersController {
  constructor(
    private readonly createComputerUseCase: CreateComputerUseCase,
    private readonly installDefenseUseCase: InstallDefenseUseCase,
  ) {}

  /**
   * Create a new computer for authenticated player.
   *
   * @param createComputerDto - Computer creation payload (name)
   * @param request - Express request with user from JWT
   * @returns ComputerDto with computer info and initial resources
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async createComputer(
    @Body() createComputerDto: CreateComputerDto,
    @Request() request: any,
  ): Promise<ComputerDto> {
    const userId = request.user.userId;

    const computer = await this.createComputerUseCase.execute(userId, createComputerDto.name);

    return this.computerToDto(computer);
  }

  /**
   * Get computer details.
   *
   * @param id - Computer ID from URL
   * @returns ComputerDto with computer state
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getComputer(@Param('id') id: string): Promise<ComputerDto> {
    // TODO: Implement GetComputerUseCase
    // For now, return placeholder
    throw new Error('Not implemented');
  }

  /**
   * Install defense on computer.
   *
   * @param id - Computer ID from URL
   * @param installDefenseDto - Defense installation payload (type)
   * @param request - Express request with user from JWT
   * @returns DefenseDto with defense info
   */
  @Post(':id/defenses')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(ValidationPipe)
  async installDefense(
    @Param('id') id: string,
    @Body() installDefenseDto: InstallDefenseDto,
    @Request() request: any,
  ): Promise<DefenseDto> {
    const userId = request.user.userId;

    const defense = await this.installDefenseUseCase.execute(
      id,
      installDefenseDto.defenseType as any,
      userId,
    );

    return this.defenseToDto(defense);
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

  /**
   * Convert Defense domain entity to DTO.
   */
  private defenseToDto(defense: Defense): DefenseDto {
    return {
      defenseId: defense.getId(),
      computerId: defense.getComputerId(),
      type: defense.getDefenseType(),
      level: defense.getLevel(),
      createdAt: defense.getInstalledAt(),
    };
  }
}
