# Technical Debt Inventory

**Date**: 2025-01-01  
**Project**: Netwatch Backend  
**Classification**: Architectural gaps, missing implementations, compliance violations  
**Risk Level**: CRITICAL (blocks game functionality)

---

## Overview

This document catalogs explicit technical debt items identified in the code review. Each item includes:
- **Why it matters**: Business impact and risk
- **Where it exists**: File locations and architectural layer
- **Suggested fix**: High-level remediation approach
- **Effort estimate**: Story points (assuming 1 SP = 4 hours)
- **Blocking**: What cannot proceed without fixing this

---

## Debt Items (Priority Order)

---

## TD-001: Missing HTTP Controllers

**Severity**: 🔴 CRITICAL  
**Category**: Architecture / API Layer  
**Blocking**: All API functionality  

### Description
Zero `@Controller` decorated classes exist. The system cannot handle HTTP requests from clients. 15 endpoints specified in [api-contracts.md](../backend-engineer/api-contracts.md) are unimplemented.

### Why It Matters
- **Business**: Game clients cannot register, authenticate, or perform actions
- **Deadlock**: Services cannot be built until controllers exist to call them
- **Time-to-market**: Blocks all game functionality

### Locations
Missing files (should exist):
```
apps/backend/src/modules/
├── users/
│   └── presentation/
│       └── users.controller.ts
├── players/
│   └── presentation/
│       └── players.controller.ts
├── computers/
│   └── presentation/
│       └── computers.controller.ts
├── hacks/
│   └── presentation/
│       └── hacks.controller.ts
└── progression/
    └── presentation/
        └── progression.controller.ts
```

### What Needs Implementing
**UsersController** (POST /auth/*, controllers):
```typescript
@Controller('auth')
export class UsersController {
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    // Delegate to AuthService.register()
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    // Delegate to AuthService.login()
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    // Delegate to AuthService.refreshToken()
  }
}
```

**PlayersController** (POST /players, GET /players/:id):
```typescript
@Controller('players')
export class PlayersController {
  @Post()
  async createPlayer(@Body() createPlayerDto: CreatePlayerDto): Promise<PlayerDto> {
    // Delegate to CreatePlayerUseCase
  }

  @Get(':playerId')
  async getPlayer(@Param('playerId') playerId: string): Promise<PlayerDto> {
    // Delegate to GetPlayerProfileUseCase
  }

  @Post(':playerId/computers')
  async createComputer(
    @Param('playerId') playerId: string,
    @Body() createComputerDto: CreateComputerDto,
  ): Promise<ComputerDto> {
    // Delegate to CreateComputerUseCase
  }
}
```

**ComputersController** (GET /computers/:id):
```typescript
@Controller('computers')
export class ComputersController {
  @Get(':id')
  async getComputer(@Param('id') id: string): Promise<ComputerDto> {
    // Delegate to GetComputerUseCase
  }

  @Post(':id/defenses')
  async installDefense(
    @Param('id') computerId: string,
    @Body() installDefenseDto: InstallDefenseDto,
  ): Promise<DefenseDto> {
    // Delegate to InstallDefenseUseCase
  }
}
```

**HacksController** (GET /hacks, POST /hacks/:id/start):
```typescript
@Controller('hacks')
export class HacksController {
  @Get()
  async listHacks(@Query() query: ListHacksQueryDto): Promise<HackOperationDto[]> {
    // Delegate to ListHacksUseCase
  }

  @Post(':hackId/start')
  async startHack(
    @Param('hackId') hackId: string,
    @Body() initiateHackDto: InitiateHackDto,
  ): Promise<{ status: string; estimatedDuration: number }> {
    // Delegate to InitiateHackUseCase
  }

  @Get(':hackId')
  async getHack(@Param('hackId') hackId: string): Promise<HackOperationDto> {
    // Delegate to GetHackUseCase
  }
}
```

**ProgressionController** (POST /unlocks):
```typescript
@Controller('progression')
export class ProgressionController {
  @Post('unlocks')
  async unlockProgression(
    @Body() unlockProgressionDto: UnlockProgressionDto,
  ): Promise<ProgressionUnlockDto> {
    // Delegate to UnlockProgressionUseCase
  }
}
```

### Implementation Approach
1. Create `src/modules/*/presentation/` directory in each module
2. Create controller class with `@Controller` decorator
3. Add route handlers for each endpoint in api-contracts.md
4. Apply `@UseGuards(JwtAuthGuard)` to protected endpoints
5. Apply `@UsePipes(ValidationPipe)` to all handlers
6. Inject dependencies (services, repositories, use-cases)
7. Delegate business logic to services (not inline in controller)

### Related Debt Items
- TD-002: Missing services (must build after this, services called by controllers)
- TD-003: Missing DTOs (DTOs must exist for controllers to validate)

### Effort Estimate
- 5 controllers × ~8 hours each = 40 hours
- 15 endpoints × 2–3 hours each (simplified: included above)
- Testing (basic E2E): +10 hours
- **Total: 50 hours (12.5 SP)**

### Reference
- [api-contracts.md](../backend-engineer/api-contracts.md) (full endpoint spec)
- [NestJS Official Docs: Controllers](https://docs.nestjs.com/controllers)

---

## TD-002: Missing Application Services & Use-Cases

**Severity**: 🔴 CRITICAL  
**Category**: Architecture / Application Layer  
**Blocking**: TD-001 (controllers), business logic implementation  

### Description
Zero `@Injectable` service classes. Business operations cannot be orchestrated. Required services:
1. AuthService (registration, login, token refresh)
2. PasswordService (hashing, verification)
3. CreatePlayerUseCase
4. GetPlayerProfileUseCase
5. CreateComputerUseCase
6. IPAddressService (unique IP generation)
7. InstallDefenseUseCase
8. InitiateHackUseCase
9. CompleteHackUseCase
10. UnlockProgressionUseCase

### Why It Matters
- **Pattern**: NestJS pattern dictates controllers are thin (2–3 lines); business logic in services
- **Testability**: Services independently testable; controllers just HTTP marshalling
- **Reusability**: Services callable from controllers AND WebSocket gateway
- **Deadlock**: Cannot implement controllers (TD-001) without services to delegate to

### Locations
Missing files (should exist):
```
apps/backend/src/modules/
├── users/application/services/
│   ├── auth.service.ts
│   └── password.service.ts
├── players/application/usecases/
│   ├── create-player.usecase.ts
│   └── get-player-profile.usecase.ts
├── computers/application/usecases/
│   ├── create-computer.usecase.ts
│   ├── install-defense.usecase.ts
│   └── services/
│       └── ip-address.service.ts
├── hacks/application/usecases/
│   ├── initiate-hack.usecase.ts
│   └── complete-hack.usecase.ts
└── progression/application/usecases/
    └── unlock-progression.usecase.ts
```

### What Needs Implementing

**AuthService** (users/application/services/auth.service.ts):
```typescript
@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string, email: string): Promise<User> {
    // Check username/email not already used
    const existing = await this.userRepository.findByUsername(username);
    if (existing) throw new ConflictException('Username already taken');

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(password);

    // Create user aggregate
    const user = User.create(username, passwordHash, email);

    // Persist
    return await this.userRepository.create(user);
  }

  async login(username: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Load user
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Verify password
    const valid = await this.passwordService.verifyPassword(password, user.getPasswordHash());
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Generate tokens
    const accessToken = this.jwtService.sign({ sub: user.getId(), username: user.getUsername() }, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign({ sub: user.getId(), type: 'refresh' }, { expiresIn: '7d' });

    // Record login time
    user.recordLogin();
    await this.userRepository.update(user);

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');

      const accessToken = this.jwtService.sign({ sub: user.getId(), username: user.getUsername() }, { expiresIn: '1h' });
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

**PasswordService** (users/application/services/password.service.ts):
```typescript
@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }
}
```

**CreatePlayerUseCase** (players/application/usecases/create-player.usecase.ts):
```typescript
@Injectable()
export class CreatePlayerUseCase {
  constructor(
    private playerRepository: PlayerRepository,
    private computerRepository: ComputerRepository,
    private ipAddressService: IPAddressService,
  ) {}

  async execute(userId: string, username: string): Promise<Player> {
    // Create player aggregate
    const playerId = createPlayerId(v4());
    const player = Player.create(playerId, userId, username);

    // Persist
    const savedPlayer = await this.playerRepository.create(player);

    // Create first computer
    const computerId = createComputerId(v4());
    const ipAddress = await this.ipAddressService.generateUniqueIP();
    const computer = Computer.create(computerId, playerId, 'Main Computer', ipAddress);

    await this.computerRepository.create(computer);

    return savedPlayer;
  }
}
```

**IPAddressService** (computers/application/services/ip-address.service.ts):
```typescript
@Injectable()
export class IPAddressService {
  private readonly pattern = /^(\d+\.\d+\.\d+\.\d+)$/;

  constructor(private computerRepository: ComputerRepository) {}

  async generateUniqueIP(): Promise<string> {
    let ip: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      ip = this.generateRandomIP();
      const existing = await this.computerRepository.findByIPAddress(ip);
      isUnique = !existing;
      attempts++;
    }

    if (!isUnique) throw new Error('Could not generate unique IP address');

    return ip;
  }

  private generateRandomIP(): string {
    // Generate IP in private range: 10.0.0.0/8
    const octet1 = 10;
    const octet2 = Math.floor(Math.random() * 256);
    const octet3 = Math.floor(Math.random() * 256);
    const octet4 = Math.floor(Math.random() * 256);
    return `${octet1}.${octet2}.${octet3}.${octet4}`;
  }
}
```

**InitiateHackUseCase** (hacks/application/usecases/initiate-hack.usecase.ts):
```typescript
@Injectable()
export class InitiateHackUseCase {
  constructor(
    private hackOperationRepository: HackOperationRepository,
    private playerRepository: PlayerRepository,
    private computerRepository: ComputerRepository,
  ) {}

  async execute(attackerId: string, targetComputerId: string, hackType: HackType, tools: string[]): Promise<HackOperation> {
    // Load attacker and target
    const attacker = await this.playerRepository.findById(attackerId);
    const targetComputer = await this.computerRepository.findById(targetComputerId);
    const targetOwner = await this.playerRepository.findById(targetComputer.getOwnerId());

    // Validate: cannot hack own computer
    if (attacker.getId() === targetOwner.getId()) {
      throw new ForbiddenException('Cannot hack your own computer');
    }

    // Create hack operation
    const hackId = createHackOperationId(v4());
    const hack = HackOperation.create(
      hackId,
      attackerId,
      targetComputerId,
      hackType,
      tools,
      300, // 5 minutes duration
    );

    // Persist
    return await this.hackOperationRepository.create(hack);
  }
}
```

### Implementation Approach
1. Create `src/modules/*/application/services/` and `src/modules/*/application/usecases/` directories
2. Implement each service with `@Injectable()` decorator
3. Inject repositories as dependencies (constructor injection)
4. Implement business logic: validation, domain aggregate operations, persistence
5. Handle errors explicitly (throw domain exceptions; let filters convert to HTTP codes)
6. Add to module providers and exports

### Related Debt Items
- TD-003: DTOs (validators for service inputs)
- TD-001: Controllers (will call these services)

### Effort Estimate
- 10 services/use-cases × 4 hours each = 40 hours
- Error handling and edge cases: +5 hours
- **Total: 45 hours (11.25 SP)**

### Reference
- [NestJS Official Docs: Providers](https://docs.nestjs.com/providers)
- [NestJS Official Docs: Dependency Injection](https://docs.nestjs.com/fundamentals/dependency-injection)

---

## TD-003: Missing Data Transfer Objects (DTOs)

**Severity**: 🔴 CRITICAL  
**Category**: API Layer / Validation  
**Blocking**: Input validation, API contract enforcement  

### Description
Zero DTO classes with `class-validator` decorators. Cannot validate incoming requests.

### Why It Matters
- **API Contract**: Controllers cannot enforce request schemas without DTOs
- **Security**: Malformed input (negative numbers, missing fields, oversized strings) passes through unchecked
- **User Experience**: Validation errors unformatted (500 instead of 400)
- **Type Safety**: TypeScript types exist, but runtime validation missing

### Locations
Missing files (should exist):
```
apps/backend/src/modules/
├── users/application/dtos/
│   ├── create-user.dto.ts
│   ├── login.dto.ts
│   ├── refresh-token.dto.ts
│   └── user.dto.ts (response)
├── players/application/dtos/
│   ├── create-player.dto.ts
│   └── player.dto.ts (response)
├── computers/application/dtos/
│   ├── create-computer.dto.ts
│   └── computer.dto.ts (response)
├── hacks/application/dtos/
│   ├── initiate-hack.dto.ts
│   └── hack-operation.dto.ts (response)
└── progression/application/dtos/
    ├── unlock-progression.dto.ts
    └── progression-unlock.dto.ts (response)
```

### What Needs Implementing

**CreateUserDto** (users/application/dtos/create-user.dto.ts):
```typescript
import { IsString, IsEmail, Length, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(3, 20, { message: 'Username must be 3–20 characters' })
  username!: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;
}
```

**LoginDto** (users/application/dtos/login.dto.ts):
```typescript
export class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}
```

**CreatePlayerDto** (players/application/dtos/create-player.dto.ts):
```typescript
export class CreatePlayerDto {
  @IsString()
  @Length(3, 20)
  username!: string;

  @IsEmail()
  email!: string;
}
```

**InitiateHackDto** (hacks/application/dtos/initiate-hack.dto.ts):
```typescript
import { IsEnum, IsArray, IsString } from 'class-validator';

export enum HackTypeEnum {
  BRUTEFORCE = 'bruteforce',
  SQLINJECTION = 'sqlinjection',
  PHISHING = 'phishing',
  TROJAN = 'trojan',
}

export class InitiateHackDto {
  @IsEnum(HackTypeEnum)
  hackType!: HackTypeEnum;

  @IsArray()
  @IsString({ each: true })
  tools!: string[];
}
```

**UserDto** (users/application/dtos/user.dto.ts) — Response only:
```typescript
export class UserDto {
  userId!: string;
  username!: string;
  email!: string;
  createdAt!: Date;
  lastLoginAt!: Date | null;
}
```

**PlayerDto** (players/application/dtos/player.dto.ts) — Response only:
```typescript
export class PlayerDto {
  playerId!: string;
  username!: string;
  level!: number;
  experience!: number;
  money!: bigint;
  energy!: number;
  energyMax!: number;
  skillPoints!: number;
  createdAt!: Date;
}
```

### Implementation Approach
1. Install `class-validator` and `class-transformer` (if not already)
2. Create DTO classes in `application/dtos/` directory per module
3. Add validation decorators: `@IsString`, `@IsEmail`, `@Length`, `@Min`, `@Max`, `@IsEnum`, etc.
4. Create corresponding response DTOs (no decorators; plain TypeScript interfaces)
5. Apply `@UsePipes(ValidationPipe)` to all controller handlers
6. Use `plainToClass` transformer if DTO transformation needed (usually not)
7. Return plain DTOs from controllers, not domain entities

### Related Debt Items
- TD-001: Controllers (will apply ValidationPipe to handlers)
- TD-006: Exception Filters (will transform validation errors to 400 HTTP code)

### Effort Estimate
- 10 DTOs × 1 hour each = 10 hours
- Validation rule discovery: +2 hours
- **Total: 12 hours (3 SP)**

### Reference
- [class-validator Docs](https://github.com/typestack/class-validator)
- [NestJS Pipes](https://docs.nestjs.com/pipes)

---

## TD-004: Missing WebSocket Gateway

**Severity**: 🔴 CRITICAL  
**Category**: Architecture / Real-Time Layer  
**Blocking**: Real-time game mechanics  

### Description
Zero `@WebSocketGateway` decorated class. Real-time communication layer missing. Architecture specifies "bidirectional persistent WebSocket connections" but no gateway exists.

### Why It Matters
- **Architecture**: Real-time is a core pillar; game loop depends on WebSocket for live updates
- **Game Design**: Players cannot see hack progress, opponent status, or resource changes in real-time
- **Playability**: Game degraded to turn-based (players poll with REST) instead of real-time
- **Player Experience**: Latency-sensitive events (hack completion, defense trigger) unobservable until poll

### Locations
Missing file:
```
apps/backend/src/common/websocket/games.gateway.ts
apps/backend/src/common/websocket/games.gateway.spec.ts
apps/backend/src/common/websocket/websocket.module.ts
```

### What Needs Implementing

**GamesGateway** (common/websocket/games.gateway.ts):
```typescript
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || '*' },
  transports: ['websocket', 'polling'],
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private playerSessions: Map<string, Socket> = new Map(); // playerId → socket

  handleConnection(client: Socket): void {
    // Extract playerId from JWT in socket handshake
    const playerId = client.handshake.auth.playerId; // TODO: Extract from JWT
    if (!playerId) {
      client.disconnect();
      return;
    }
    this.playerSessions.set(playerId, client);
    console.log(`Player ${playerId} connected`);
  }

  handleDisconnect(client: Socket): void {
    const playerId = Array.from(this.playerSessions.entries()).find(([_, socket]) => socket === client)?.[0];
    if (playerId) {
      this.playerSessions.delete(playerId);
      console.log(`Player ${playerId} disconnected`);
    }
  }

  @SubscribeMessage('hackInitiated')
  handleHackInitiated(client: Socket, data: { attackerId: string; targetComputerId: string }): void {
    // Broadcast to target owner: "Player X is hacking your computer Y"
    const targetOwner = this.getTargetOwnerFromComputer(data.targetComputerId); // TODO: Load from DB
    const targetSocket = this.playerSessions.get(targetOwner);
    if (targetSocket) {
      targetSocket.emit('hackInitiated', { attackerId: data.attackerId, targetComputerId: data.targetComputerId });
    }
  }

  @SubscribeMessage('hackCompleted')
  handleHackCompleted(client: Socket, data: { hackId: string; status: string }): void {
    // Broadcast to attacker and target owner
    const hack = this.getHackOperation(data.hackId); // TODO: Load from DB
    const attackerSocket = this.playerSessions.get(hack.attackerId);
    const targetOwnerSocket = this.playerSessions.get(hack.targetOwnerId);

    if (attackerSocket) {
      attackerSocket.emit('hackCompleted', { hackId: data.hackId, status: data.status, reward: hack.reward });
    }
    if (targetOwnerSocket) {
      targetOwnerSocket.emit('hackCompleted', { hackId: data.hackId, status: data.status, loss: hack.loss });
    }
  }

  @SubscribeMessage('resourcesUpdated')
  handleResourcesUpdated(client: Socket, data: { playerId: string; money: bigint; energy: number }): void {
    const socket = this.playerSessions.get(data.playerId);
    if (socket) {
      socket.emit('resourcesUpdated', { money: data.money, energy: data.energy });
    }
  }

  // Helper methods (TODO: Inject repositories to load real data)
  private getTargetOwnerFromComputer(computerId: string): string {
    // Load Computer from repository, return owner ID
    return '';
  }

  private getHackOperation(hackId: string): any {
    // Load HackOperation from repository
    return {};
  }
}
```

**WebSocketModule** (common/websocket/websocket.module.ts):
```typescript
import { Module } from '@nestjs/common';
import { GamesGateway } from './games.gateway';

@Module({
  providers: [GamesGateway],
  exports: [GamesGateway],
})
export class WebSocketModule {}
```

### Events to Implement
From [realtime-events.md](../backend-engineer/realtime-events.md):

| Event | Emitted By | Broadcast To | Payload |
|-------|-----------|--------------|---------|
| PlayerStatusChanged | login/logout | followers | { playerId, isOnline, lastStatusAt } |
| HackInitiated | InitiateHackUseCase | target owner | { hackId, attackerId, targetComputerId, hackType } |
| HackCompleted | CompleteHackUseCase | attacker + target owner | { hackId, status, attackerReward, targetLoss } |
| DefenseInstalled | InstallDefenseUseCase | attacker | { computerId, defenseType, level } |
| ResourcesUpdated | any use-case | player | { money, energy, energyMax, experience } |
| PlayerProgressionUnlocked | UnlockProgressionUseCase | player | { unlockType, unlockKey, description } |

### Integration Points
1. **Use-Cases Emit Events**: After domain state changes, use-case calls `this.eventsGateway.emit('eventName', payload)`
2. **Gateway Broadcasts**: Gateway receives event, looks up player socket(s), emits to client(s)
3. **Client Listens**: Frontend listens on socket for events; updates UI without polling

### Implementation Approach
1. Install `@nestjs/websockets` and `socket.io` (if not already)
2. Create WebSocketModule and import in AppModule
3. Create GamesGateway with `@WebSocketGateway` decorator
4. Implement connection/disconnection handlers
5. Implement event subscribers for each real-time event
6. Inject repositories to load player/computer/hack data
7. Broadcast to relevant player socket(s)
8. Emit events from use-cases after business logic completes

### Related Debt Items
- TD-002: Services must emit events to gateway after state changes
- TD-009: Event publishing service (decouple use-cases from gateway)

### Effort Estimate
- Gateway setup: 4 hours
- Event handlers (6 events): 12 hours
- Integration with use-cases: 8 hours
- Testing: 4 hours
- **Total: 28 hours (7 SP)**

### Reference
- [NestJS WebSockets Documentation](https://docs.nestjs.com/websockets/gateways)
- [Socket.IO Documentation](https://socket.io/docs/)

---

## TD-005: Missing Authentication & Security Guards

**Severity**: 🔴 CRITICAL  
**Category**: Security / Authentication  
**Blocking**: Protected endpoint enforcement, password hashing  

### Description
Zero `@UseGuards` decorators. All endpoints public (no authentication required). Password hashing missing.

### Why It Matters
- **Security**: Attackers can impersonate any player, modify their resources, hack on their behalf
- **Game Integrity**: Without auth, no player isolation; all game state manipulable
- **Compliance**: No audit trail (who did what); attacks untraceable
- **Determinism**: Same action by different players cannot be distinguished

### Locations
Missing files:
```
apps/backend/src/common/guards/
├── jwt-auth.guard.ts
├── optional-jwt-auth.guard.ts
└── roles.guard.ts (future)

apps/backend/src/common/strategies/
└── jwt.strategy.ts

apps/backend/src/modules/users/application/services/
└── password.service.ts (should exist per TD-002, but security-critical)
```

### What Needs Implementing

**JwtAuthGuard** (common/guards/jwt-auth.guard.ts):
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Optional: Customize error handling
}
```

**JwtStrategy** (common/strategies/jwt.strategy.ts):
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../modules/users/infrastructure/persistence/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    });
  }

  async validate(payload: any): Promise<any> {
    // Verify user still exists and is active
    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return { userId: payload.sub, username: payload.username };
  }
}
```

**Updated AuthService** (users/application/services/auth.service.ts) — Password handling:
```typescript
@Injectable()
export class AuthService {
  // ... (existing code)

  async register(username: string, password: string, email: string): Promise<User> {
    const existing = await this.userRepository.findByUsername(username);
    if (existing) throw new ConflictException('Username already taken');

    // Hash password before creating user
    const passwordHash = await this.passwordService.hashPassword(password);
    const user = User.create(username, passwordHash, email);

    return await this.userRepository.create(user);
  }
}
```

**PasswordService** (users/application/services/password.service.ts):
```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  async hashPassword(plainPassword: string): Promise<string> {
    if (plainPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    return await bcrypt.hash(plainPassword, this.saltRounds);
  }

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }
}
```

### Applying Guards to Controllers

**Example: PlayersController** (before and after):

**Before** (unprotected):
```typescript
@Controller('players')
export class PlayersController {
  @Post()
  async createPlayer(@Body() createPlayerDto: CreatePlayerDto): Promise<PlayerDto> {
    // Anyone can create players!
  }
}
```

**After** (protected):
```typescript
@Controller('players')
export class PlayersController {
  constructor(private createPlayerUseCase: CreatePlayerUseCase) {}

  @Post()
  @UseGuards(JwtAuthGuard)  // <-- Add this
  async createPlayer(
    @Request() req, // Injected by passport after guard passes
    @Body() createPlayerDto: CreatePlayerDto,
  ): Promise<PlayerDto> {
    const userId = req.user.userId;
    return await this.createPlayerUseCase.execute(userId, createPlayerDto.username);
  }
}
```

### Protected vs. Unprotected Endpoints

From [api-contracts.md](../backend-engineer/api-contracts.md):

| Endpoint | Method | Auth | Guard |
|----------|--------|------|-------|
| /auth/register | POST | No | None |
| /auth/login | POST | No | None |
| /auth/refresh | POST | No | None |
| /players | POST | Yes | JwtAuthGuard |
| /players/:id | GET | Yes | JwtAuthGuard |
| /players/:id/computers | POST | Yes | JwtAuthGuard |
| /computers/:id | GET | Yes | JwtAuthGuard |
| /computers/:id/defenses | POST | Yes | JwtAuthGuard |
| /hacks | GET | Yes | JwtAuthGuard |
| /hacks/:id/start | POST | Yes | JwtAuthGuard |
| /unlocks | POST | Yes | JwtAuthGuard |

### Implementation Approach
1. Install `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcryptjs`
2. Create JwtStrategy and JwtAuthGuard
3. Import JwtModule in UsersModule with ConfigService for secret
4. Implement PasswordService with bcrypt
5. Apply `@UseGuards(JwtAuthGuard)` to protected endpoints in controllers
6. Extract `req.user` from guard output; use userId for authorization
7. Test token generation and verification

### Related Debt Items
- TD-001: Controllers (will apply @UseGuards to protected endpoints)
- TD-002: AuthService must call PasswordService

### Effort Estimate
- JwtStrategy + JwtAuthGuard: 4 hours
- PasswordService: 2 hours
- Integrate into AuthService: 2 hours
- Apply guards to all controllers: 8 hours
- Testing: 4 hours
- **Total: 20 hours (5 SP)**

### Reference
- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [Passport.js JWT Strategy](http://www.passportjs.org/packages/passport-jwt/)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

---

## TD-006: Missing Global Exception Filters

**Severity**: 🟠 MAJOR  
**Category**: API Layer / Error Handling  
**Blocking**: Consistent error responses  

### Description
Zero `@Catch` decorated exception filters. Unhandled domain exceptions return raw stacktraces to clients.

### Why It Matters
- **API Contract**: api-contracts.md specifies error codes (400, 401, 403, 404, 409); filter enforces them
- **Security**: Stacktraces leak internal structure, database queries, file paths
- **UX**: Frontend cannot distinguish validation errors (400) from auth errors (401) from domain errors (409)
- **Observability**: Errors logged inconsistently; cannot track error patterns

### Locations
Missing files:
```
apps/backend/src/common/filters/
├── http-exception.filter.ts
├── domain-error.filter.ts
└── all-exceptions.filter.ts (catch-all)

apps/backend/src/common/exceptions/
└── domain.exception.ts
```

### What Needs Implementing

**DomainException** (common/exceptions/domain.exception.ts):
```typescript
export class DomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpCode: number = 400,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}
```

**Example Domain Exceptions**:
```typescript
export class CannotHackOwnComputerException extends DomainException {
  constructor() {
    super('CANNOT_HACK_OWN_COMPUTER', 'Cannot hack your own computer', 403);
  }
}

export class InsufficientResourcesException extends DomainException {
  constructor(required: bigint, available: bigint) {
    super('INSUFFICIENT_RESOURCES', `Requires ${required} but have ${available}`, 409);
  }
}

export class ComputerNotFoundExce
ption extends DomainException {
  constructor(id: string) {
    super('COMPUTER_NOT_FOUND', `Computer ${id} not found`, 404);
  }
}
```

**HttpExceptionFilter** (common/filters/http-exception.filter.ts):
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorPayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message: typeof exceptionResponse === 'string' ? exceptionResponse : (exceptionResponse as any).message,
      error: status >= 500 ? 'Internal Server Error' : 'Bad Request',
    };

    // Log error for observability
    if (status >= 500) {
      this.logger.error(`HTTP ${status}:`, exception.message, exception.stack);
    } else {
      this.logger.warn(`HTTP ${status}: ${errorPayload.message}`);
    }

    response.status(status).json(errorPayload);
  }
}
```

**DomainErrorFilter** (common/filters/domain-error.filter.ts):
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';

@Catch(DomainException)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.httpCode || 400;

    const errorPayload = {
      statusCode: status,
      code: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    };

    this.logger.warn(`Domain Error [${exception.code}]: ${exception.message}`);

    response.status(status).json(errorPayload);
  }
}
```

**AllExceptionsFilter** (common/filters/all-exceptions.filter.ts) — Catch-all:
```typescript
import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(`Unhandled Exception:`, exception instanceof Error ? exception.message : String(exception), exception instanceof Error ? exception.stack : '');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: 'Internal Server Error',
      error: 'Internal Server Error',
    });
  }
}
```

### Registering Filters Globally

**main.ts**:
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register exception filters (order matters; more specific first)
  app.useGlobalFilters(
    new DomainErrorFilter(),
    new HttpExceptionFilter(),
    new AllExceptionsFilter(),
  );

  // ... rest of bootstrap
}
```

### Error Handling in Domain

**Example: HackOperation.constructor()** (before and after):

**Before** (raw error):
```typescript
throw new Error('Cannot hack own computer');
```

**After** (domain exception):
```typescript
import { CannotHackOwnComputerException } from '../exceptions';

if (attackerId === targetOwnerId) {
  throw new CannotHackOwnComputerException();
}
```

### API Response Examples

**Successful Request**:
```json
{ "playerId": "123", "username": "alice", "level": 5 }
```

**Validation Error (400)**:
```json
{
  "statusCode": 400,
  "message": "username must be 3–20 characters",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/auth/register",
  "error": "Bad Request"
}
```

**Auth Error (401)**:
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/auth/login",
  "error": "Unauthorized"
}
```

**Domain Error (409)**:
```json
{
  "statusCode": 409,
  "code": "INSUFFICIENT_RESOURCES",
  "message": "Requires 1000 money but have 500",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/defenses",
  "error": "Conflict"
}
```

### Implementation Approach
1. Create exception classes for domain errors (CannotHackOwnComputer, InsufficientResources, etc.)
2. Create exception filters (DomainErrorFilter, HttpExceptionFilter, AllExceptionsFilter)
3. Register filters globally in main.ts
4. Replace raw `throw new Error()` with domain exceptions in entities/services
5. Test that each error type returns correct HTTP code
6. Log errors for debugging

### Related Debt Items
- TD-002: Services should throw domain exceptions
- TD-006: Logging should record thrown exceptions

### Effort Estimate
- Exception classes (5–10 domain exceptions): 3 hours
- Exception filters (3 filters): 4 hours
- Domain error refactoring: 3 hours
- Testing: 4 hours
- **Total: 14 hours (3.5 SP)**

### Reference
- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)

---

## TD-007: No Test Suite (0% Coverage)

**Severity**: 🟠 MAJOR  
**Category**: QA / Testing  
**Blocking**: Regression detection, correctness verification  

### Description
Testing pyramid specified in [testing-strategy.md](../backend-engineer/testing-strategy.md) but 0% implemented. No unit, integration, or E2E tests.

### Why It Matters
- **Correctness**: No verification that domain logic (level formula, hack success rate, etc.) works as designed
- **Regression**: Refactoring domain without test coverage risks silent breakage
- **Confidence**: Cannot ship features without test evidence
- **Documentation**: Tests serve as living documentation of expected behavior

### Test Pyramid (from testing-strategy.md)
- **70% Unit Tests** (domain entities, value objects, services)
  - Money.add(), Money.subtract(), Money.compare()
  - Energy.consume(), Energy.regenerate(), Energy.withMaxCapacity()
  - Player.getMoney(), Player.consumeEnergy(), computed level
  - User invariants (username length, email format)
  - HackOperation status state machine

- **25% Integration Tests** (repositories, API endpoints)
  - PlayerRepository.findById(), create(), update(), delete()
  - HackOperationRepository (persistence + enum mapping)
  - POST /auth/register → user created in DB
  - POST /players → player + computer created in DB
  - POST /hacks/:id/start → hack_operations row inserted

- **5% E2E Tests** (full user flows)
  - POST /auth/register → POST /auth/login → POST /players → POST /hacks/:id/start → verify hack_operations

### Missing Test Files

**Unit Tests** (70%):
```
packages/domain/src/__tests__/
├── entities/
│   ├── user.entity.spec.ts
│   ├── player.entity.spec.ts
│   ├── computer.entity.spec.ts
│   ├── hack-operation.entity.spec.ts
│   ├── defense.entity.spec.ts
│   └── progression-unlock.entity.spec.ts
└── value-objects/
    ├── money.spec.ts
    └── energy.spec.ts

apps/backend/src/__tests__/
├── modules/users/infrastructure/persistence/user.repository.spec.ts
├── modules/players/infrastructure/persistence/player.repository.spec.ts
├── modules/computers/infrastructure/persistence/computer.repository.spec.ts
├── modules/hacks/infrastructure/persistence/hack-operation.repository.spec.ts
├── modules/defenses/infrastructure/persistence/defense.repository.spec.ts
└── modules/progression/infrastructure/persistence/progression-unlock.repository.spec.ts
```

**Integration Tests** (25%):
```
apps/backend/src/__tests__/
├── modules/users/application/services/auth.service.spec.ts
├── modules/players/application/usecases/create-player.usecase.spec.ts
├── modules/hacks/application/usecases/initiate-hack.usecase.spec.ts
└── (controller integration tests for all 15+ endpoints)
```

**E2E Tests** (5%):
```
apps/backend/e2e/
├── auth.e2e-spec.ts
├── players.e2e-spec.ts
├── computers.e2e-spec.ts
├── hacks.e2e-spec.ts
└── progression.e2e-spec.ts
```

### Example Unit Test

**money.spec.ts** (from testing-strategy.md):
```typescript
import { Money } from '@netwatch/domain';

describe('Money Value Object', () => {
  describe('constructor', () => {
    it('should throw on negative amount', () => {
      expect(() => new Money(-100n)).toThrow('Money cannot be negative');
    });

    it('should accept zero', () => {
      const money = new Money(0n);
      expect(money.getAmount()).toBe(0n);
    });
  });

  describe('add', () => {
    it('should increase amount', () => {
      const money1 = new Money(100n);
      const money2 = money1.add(new Money(50n));
      expect(money2.getAmount()).toBe(150n);
    });

    it('should not mutate original', () => {
      const money1 = new Money(100n);
      const money2 = money1.add(new Money(50n));
      expect(money1.getAmount()).toBe(100n); // Original unchanged
      expect(money2.getAmount()).toBe(150n);
    });
  });

  describe('comparison', () => {
    it('should return true if greater than', () => {
      const money1 = new Money(100n);
      const money2 = new Money(50n);
      expect(money1.isGreaterThan(money2)).toBe(true);
    });

    it('should return true if equal', () => {
      const money1 = new Money(100n);
      const money2 = new Money(100n);
      expect(money1.equals(money2)).toBe(true);
    });
  });
});
```

### Example Integration Test

**player.repository.spec.ts**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlayerRepository } from './player.repository';
import { PlayerEntity } from '../../infrastructure/database/entities/player.entity';
import { Repository } from 'typeorm';
import { Player, PlayerId } from '@netwatch/domain';

describe('PlayerRepository', () => {
  let repository: PlayerRepository;
  let typeormRepo: Repository<PlayerEntity>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerRepository,
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: { /* mocked repository */ },
        },
      ],
    }).compile();

    repository = module.get<PlayerRepository>(PlayerRepository);
    typeormRepo = module.get(getRepositoryToken(PlayerEntity));
  });

  describe('create', () => {
    it('should persist player and return domain entity', async () => {
      const player = Player.create(
        '123' as PlayerId,
        'user-1',
        'alice',
      );

      jest.spyOn(typeormRepo, 'save').mockResolvedValue({
        id: '123',
        user_id: 'user-1',
        username: 'alice',
        money: 1000n,
        energy: 100,
        energy_max: 100,
        experience: 0,
        skill_points: 0,
        created_at: new Date(),
      } as any);

      const result = await repository.create(player);

      expect(result.getId()).toBe('123');
      expect(result.getUsername()).toBe('alice');
      expect(typeormRepo.save).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return player or null', async () => {
      jest.spyOn(typeormRepo, 'findOne').mockResolvedValue({
        id: '123',
        user_id: 'user-1',
        username: 'alice',
        money: 1000n,
        energy: 100,
        energy_max: 100,
        experience: 100,
        skill_points: 0,
        created_at: new Date(),
      } as any);

      const player = await repository.findById('123' as PlayerId);

      expect(player).toBeDefined();
      expect(player?.getUsername()).toBe('alice');
      expect(player?.getLevel()).toBe(1); // floor(sqrt(100/100)) = 1
    });
  });
});
```

### Example E2E Test

**auth.e2e-spec.ts**:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear database
    await dataSource.query('TRUNCATE TABLE users CASCADE');
  });

  describe('POST /auth/register', () => {
    it('should create user and return userId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'alice',
          password: 'securepassword123',
          email: 'alice@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBeDefined();
      expect(response.body.username).toBe('alice');
      expect(response.body.email).toBe('alice@example.com');
    });

    it('should return 409 on duplicate username', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'alice',
          password: 'securepassword123',
          email: 'alice@example.com',
        });

      // Duplicate attempt
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'alice',
          password: 'differentpassword456',
          email: 'alice2@example.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('USERNAME_ALREADY_TAKEN');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'alice',
          password: 'securepassword123',
          email: 'alice@example.com',
        });
    });

    it('should return tokens on valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'alice',
          password: 'securepassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should return 401 on invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'alice',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});
```

### Implementation Approach
1. Install jest, @nestjs/testing, supertest (if not already)
2. Create test files parallel to implementation files (e.g., `player.entity.ts` → `player.entity.spec.ts`)
3. Write unit tests for all domain entities and value objects (70%)
4. Write integration tests for repositories and use-cases (25%)
5. Write E2E tests for critical user flows (5%)
6. Add `pnpm test` and `pnpm test:e2e` scripts to package.json
7. Aim for >80% code coverage

### Related Debt Items
- All other TDs benefit from tests (especially TD-001 through TD-005)

### Effort Estimate
- Unit tests (domain, VOs, repos): 20 hours
- Integration tests (services, use-cases): 15 hours
- E2E tests (controllers, flows): 15 hours
- **Total: 50 hours (12.5 SP)**

### Reference
- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)

---

## TD-008: Missing Structured Logging & Observability

**Severity**: 🟡 MINOR  
**Category**: Observability / Debugging  
**Blocking**: Debugging production issues, audit trails  

### Description
Only NestJS default logger (console output). No structured logging, no game event tracking.

### Why It Matters
- **Debugging**: Cannot trace request flow or identify bottlenecks
- **Audit Trail**: Game events (hacks, defenses, unlocks) not logged; cannot reconstruct player disputes
- **Performance**: No visibility into slow queries or long-running operations
- **Security**: Failed logins, unauthorized access attempts not tracked

### Locations
Missing integrations:
```
apps/backend/src/common/logging/
├── logger.module.ts
├── logger.service.ts
└── logging.interceptor.ts
```

### What Needs Implementing

**LoggerService** (common/logging/logger.service.ts):
```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });
  }

  info(message: string, data?: any): void {
    this.logger.info(message, data);
  }

  error(message: string, error?: any, stack?: string): void {
    this.logger.error(message, { error, stack });
  }

  debug(message: string, data?: any): void {
    this.logger.debug(message, data);
  }

  // Game events
  hackInitiated(attackerId: string, targetComputerId: string, hackType: string): void {
    this.logger.info('hack_initiated', { attackerId, targetComputerId, hackType });
  }

  hackCompleted(hackId: string, attackerId: string, status: string): void {
    this.logger.info('hack_completed', { hackId, attackerId, status });
  }

  defenseInstalled(computerId: string, defenseType: string): void {
    this.logger.info('defense_installed', { computerId, defenseType });
  }
}
```

**LoggingInterceptor** (common/logging/logging.interceptor.ts):
```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(`${method} ${url} (${duration}ms) [User: ${user?.userId || 'anonymous'}]`);
      }),
    );
  }
}
```

### Implementation Approach
1. Install `winston` (or `pino`)
2. Create LoggerService with structured logging methods
3. Create LoggingInterceptor for request/response tracking
4. Register interceptor globally in main.ts: `app.useGlobalInterceptors(new LoggingInterceptor())`
5. Inject LoggerService into use-cases/services
6. Log game events at critical points (hack initiated, completed, defense installed)
7. Configure log file rotation for production
8. Add `LOG_LEVEL` to .env (debug, info, warn, error)

### Related Debt Items
- Useful for debugging all other TDs

### Effort Estimate
- Winston integration: 3 hours
- Logging interceptor: 2 hours
- Game event logging: 3 hours
- **Total: 8 hours (2 SP)**

### Reference
- [Winston Documentation](https://github.com/winstonjs/winston)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)

---

## TD-009: Missing IP Address Generation Service

**Severity**: ⚠️ MINOR  
**Category**: Business Logic / Utilities  
**Blocking**: Computer creation (collision risk)  

### Description
ComputerRepository accepts pre-generated IP addresses (caller must generate). No deterministic, collision-free IP generation service exists.

### Why It Matters
- **Determinism**: If caller generates IPs randomly, collision risk exists (multiple computers same IP)
- **Centralization**: IP generation logic should be owned by one service, not scattered across callers
- **Testability**: Service-owned logic easier to test and verify

### Locations
Missing file:
```
apps/backend/src/modules/computers/application/services/
└── ip-address.service.ts
```

### What Needs Implementing

**IPAddressService** (computers/application/services/ip-address.service.ts):
```typescript
@Injectable()
export class IPAddressService {
  constructor(private computerRepository: ComputerRepository) {}

  async generateUniqueIP(): Promise<string> {
    // Generate random IP in private range (10.0.0.0/8)
    // Retry up to 100 times if collision
    // Throw if cannot generate unique IP
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const ip = this.generateRandomIP();
      const existing = await this.computerRepository.findByIPAddress(ip);
      if (!existing) {
        return ip;
      }
      attempts++;
    }

    throw new Error('Could not generate unique IP address after 100 attempts');
  }

  private generateRandomIP(): string {
    // Format: 10.X.Y.Z where X, Y, Z are 0–255
    const octet2 = Math.floor(Math.random() * 256);
    const octet3 = Math.floor(Math.random() * 256);
    const octet4 = Math.floor(Math.random() * 256);
    return `10.${octet2}.${octet3}.${octet4}`;
  }
}
```

### Integration

**CreateComputerUseCase** (calls IPAddressService):
```typescript
@Injectable()
export class CreateComputerUseCase {
  constructor(
    private computerRepository: ComputerRepository,
    private ipAddressService: IPAddressService,
  ) {}

  async execute(playerId: string, computerName: string): Promise<Computer> {
    const computerId = createComputerId(v4());
    const ipAddress = await this.ipAddressService.generateUniqueIP(); // <-- Call service

    const computer = Computer.create(computerId, playerId, computerName, ipAddress);
    return await this.computerRepository.create(computer);
  }
}
```

### Implementation Approach
1. Create IPAddressService with generateUniqueIP() method
2. Query ComputerRepository.findByIPAddress() to detect collisions
3. Retry with backoff if collision
4. Throw error if max retries exceeded
5. Inject service into CreateComputerUseCase
6. Test collision handling

### Effort Estimate
- Service implementation: 2 hours
- Integration with CreateComputerUseCase: 1 hour
- Testing: 1 hour
- **Total: 4 hours (1 SP)**

---

## TD-010: Getter Methods & Object Calisthenics Rule 7

**Severity**: 🟡 MINOR  
**Category**: Code Quality / OOP Design  
**Blocking**: None (pragmatic trade-off accepted)  

### Description
Domain entities use getter methods (`getId()`, `getOwnerId()`, `getMoney()`, etc.). Strict Object Calisthenics Rule 7 says "Keep collections private (no getters on collections)"; interpreted strictly, this includes all getters.

### Why It Matters
- **Strict OOP**: Rule 7 enforces encapsulation; getters violate tell-don't-ask principle
- **Pragmatism**: Getters are common in practical OOP; many projects accept the trade-off
- **Current Status**: Code is pragmatically reasonable; not a blocker

### Example Violation

**Player.ts**:
```typescript
getMoney(): Money { return this.money; } // Getter violates Rule 7 (strict)
getEnergy(): Energy { return this.energy; } // Getter violates Rule 7 (strict)
```

### Acceptable Mitigations
1. **Accept the pragmatism** (recommended): Getters are industry standard for data access. Current code strikes balance between purity and practicality.
2. **Refactor to tell-don't-ask**: Pass operations to entity instead of extracting data.
   ```typescript
   // Current (getter):
   if (player.getMoney().isGreaterThan(cost)) { ... }

   // Tell-don't-ask (more OOP):
   if (player.canAfford(cost)) { ... }
   ```

### Effort Estimate (If Chosen to Refactor)
- Refactor all getter calls to behavior methods: 20 hours
- Update services/use-cases to call behavior instead of extract-then-call: 10 hours
- **Total: 30 hours (7.5 SP)**

**Recommendation**: Accept getters as pragmatic trade-off. Not worth refactoring.

---

## Summary Table

| ID | Title | Severity | Effort (SP) | Status |
|----|-------|----------|------------|--------|
| TD-001 | Missing HTTP Controllers | 🔴 CRITICAL | 12.5 | Not Started |
| TD-002 | Missing Application Services | 🔴 CRITICAL | 11.25 | Not Started |
| TD-003 | Missing DTOs & Validation | 🔴 CRITICAL | 3 | Not Started |
| TD-004 | Missing WebSocket Gateway | 🔴 CRITICAL | 7 | Not Started |
| TD-005 | Missing Authentication & Guards | 🔴 CRITICAL | 5 | Not Started |
| TD-006 | Missing Exception Filters | 🟠 MAJOR | 3.5 | Not Started |
| TD-007 | No Test Suite | 🟠 MAJOR | 12.5 | Not Started |
| TD-008 | Missing Logging & Observability | 🟡 MINOR | 2 | Not Started |
| TD-009 | Missing IP Address Service | 🟡 MINOR | 1 | Not Started |
| TD-010 | Getter Methods (OOP Style) | 🟡 MINOR | 30 (Optional) | Not Started |
| | **TOTAL (Mandatory)** | | **57.75 SP** | |
| | **TOTAL (With Logging)** | | **59.75 SP** | |
| | **TOTAL (With OOP Refactor)** | | **89.75 SP** | |

---

## Remediation Roadmap

### Phase 1: Restore API Functionality (2 weeks)
- [ ] TD-001: Implement controllers (40 hours)
- [ ] TD-002: Implement services (40 hours)
- [ ] TD-003: Create DTOs (12 hours)
- **Outcome**: API endpoints operational with 201/200/400 responses
- **Blocking Removal**: All endpoints callable

### Phase 2: Secure the API (1 week)
- [ ] TD-005: Implement authentication (20 hours)
- [ ] TD-009: IP address service (4 hours)
- **Outcome**: Protected endpoints, password hashing, JWT tokens
- **Blocking Removal**: API secure

### Phase 3: Real-Time Communication (1 week)
- [ ] TD-004: WebSocket gateway (28 hours)
- **Outcome**: Live game updates to players
- **Blocking Removal**: Real-time feature

### Phase 4: Error Handling (3 days)
- [ ] TD-006: Exception filters (14 hours)
- **Outcome**: Consistent error responses (400, 401, 403, 404, 409)
- **Blocking Removal**: API contract compliance

### Phase 5: Testing & Observability (2 weeks)
- [ ] TD-007: Test suite (50 hours)
- [ ] TD-008: Logging (8 hours)
- **Outcome**: Regression detection, audit trails
- **Blocking Removal**: Confidence in correctness

### Optional: OOP Refactoring (1 week)
- [ ] TD-010: Getters → tell-don't-ask (30 hours)
- **Outcome**: Stricter Object Calisthenics compliance
- **Value**: Marginal; recommended to skip

---

**Debt Report Completed**: 2025-01-01  
**Total Mandatory Work**: ~60 developer days (assuming 8-hour days)  
**Recommended Phases**: 7 weeks with standard team velocity
