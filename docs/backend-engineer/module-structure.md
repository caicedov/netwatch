# Module Structure Documentation

## Overview

This document describes the current module organization in the NetWatch backend. The architecture follows NestJS best practices with DDD (Domain-Driven Design) principles, organizing code by feature modules with clear separation of concerns across layers.

---

## Architecture Layers

Each module follows a **3-layer architecture**:

```
modules/{feature}/
├── application/
│   ├── services/      # Cross-cutting business logic (e.g., hashing, IP generation)
│   ├── usecases/      # Explicit orchestration of domain operations
│   └── dtos/          # Request/response validation schemas
├── presentation/      # HTTP controllers (routes, guards, error handling)
└── domain/            # Core entities, value objects, domain logic (in @packages/domain)
```

**Dependency Direction:** `Presentation → Application → Domain`
- Presentation depends on Application (use-cases, DTOs)
- Application depends on Domain (entities, repositories)
- Domain has NO dependencies on Application or Presentation

---

## Module Inventory

### 1. Users Module
**Path:** `apps/backend/src/modules/users/`

**Responsibilities:**
- User registration and authentication
- Password hashing and verification
- JWT token generation (access + refresh)
- User state management (active/inactive)

**Application Layer:**
- **Services:**
  - `PasswordService` - Bcrypt password hashing (10 salt rounds)
  - `AuthService` - Registration, login, token refresh
- **Use-Cases:** None (logic in AuthService)
- **DTOs:**
  - `CreateUserDto` - Registration request
  - `LoginDto` - Login request
  - `RefreshTokenDto` - Refresh token request
  - `UserDto` - User response
  - `AuthResponseDto` - Auth response with tokens

**Presentation Layer:**
- **Controllers:**
  - `UsersController`
    - `POST /auth/register` (201 Created)
    - `POST /auth/login` (200 OK)
    - `POST /auth/refresh` (200 OK)

**Exports:**
- `UserRepository`
- `PasswordService`
- `AuthService`

**Dependencies:**
- `@nestjs/jwt` (JwtModule)
- `@nestjs/passport` (PassportModule)

**Module Configuration:**
```typescript
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
  ],
  providers: [UserRepository, PasswordService, AuthService, JwtStrategy],
  controllers: [UsersController],
  exports: [UserRepository, PasswordService, AuthService],
})
export class UsersModule {}
```

---

### 2. Players Module
**Path:** `apps/backend/src/modules/players/`

**Responsibilities:**
- Player character creation
- Player profile retrieval
- Resource management (energy, money, experience)
- Level calculation (computed from experience)

**Application Layer:**
- **Services:** None
- **Use-Cases:**
  - `CreatePlayerUseCase` - Create new player for authenticated user
  - `GetPlayerProfileUseCase` - Retrieve player profile with authorization
- **DTOs:**
  - `CreatePlayerDto` - Player creation request
  - `PlayerDto` - Player response

**Presentation Layer:**
- **Controllers:**
  - `PlayersController`
    - `POST /players` (201 Created, @UseGuards(JwtAuthGuard))
    - `GET /players/:playerId` (200 OK, @UseGuards(JwtAuthGuard))

**Exports:**
- `PlayerRepository`
- `CreatePlayerUseCase`
- `GetPlayerProfileUseCase`

**Dependencies:** None

**Module Configuration:**
```typescript
@Module({
  providers: [PlayerRepository, CreatePlayerUseCase, GetPlayerProfileUseCase],
  controllers: [PlayersController],
  exports: [PlayerRepository, CreatePlayerUseCase, GetPlayerProfileUseCase],
})
export class PlayersModule {}
```

---

### 3. Computers Module
**Path:** `apps/backend/src/modules/computers/`

**Responsibilities:**
- Computer node creation (generates IP address)
- Defense installation (firewall, IDS, honeypot, backup)
- Computer ownership validation
- IP address collision detection

**Application Layer:**
- **Services:**
  - `IPAddressService` - Generate unique IPs (10.0.0.0/8 range)
- **Use-Cases:**
  - `CreateComputerUseCase` - Create computer with unique IP
  - `InstallDefenseUseCase` - Install defense with ownership check
- **DTOs:**
  - `CreateComputerDto` - Computer creation request
  - `ComputerDto` - Computer response
  - `InstallDefenseDto` - Defense installation request
  - `DefenseDto` - Defense response

**Presentation Layer:**
- **Controllers:**
  - `ComputersController`
    - `POST /computers` (201 Created, @UseGuards(JwtAuthGuard))
    - `POST /computers/:computerId/defenses` (201 Created, @UseGuards(JwtAuthGuard))

**Exports:**
- `ComputerRepository`
- `DefenseRepository`
- `IPAddressService`
- `CreateComputerUseCase`
- `InstallDefenseUseCase`

**Dependencies:** None

**Module Configuration:**
```typescript
@Module({
  providers: [
    ComputerRepository,
    DefenseRepository,
    IPAddressService,
    CreateComputerUseCase,
    InstallDefenseUseCase,
  ],
  controllers: [ComputersController],
  exports: [
    ComputerRepository,
    DefenseRepository,
    IPAddressService,
    CreateComputerUseCase,
    InstallDefenseUseCase,
  ],
})
export class ComputersModule {}
```

---

### 4. Hacks Module
**Path:** `apps/backend/src/modules/hacks/`

**Responsibilities:**
- Hack operation initiation
- **Server-authoritative self-hack prevention**
- Hack progress tracking
- Hack result computation

**Application Layer:**
- **Services:** None
- **Use-Cases:**
  - `InitiateHackUseCase` - Start hack operation with validations
- **DTOs:**
  - `InitiateHackDto` - Hack initiation request
  - `HackOperationDto` - Hack operation response

**Presentation Layer:**
- **Controllers:**
  - `HacksController`
    - `GET /hacks` (200 OK, @UseGuards(JwtAuthGuard))
    - `POST /hacks/:computerId/start` (202 Accepted, @UseGuards(JwtAuthGuard))
    - `GET /hacks/:hackId` (200 OK, @UseGuards(JwtAuthGuard))

**Exports:**
- `HackOperationRepository`
- `InitiateHackUseCase`

**Dependencies:**
- `PlayersModule` (to validate attacker exists)
- `ComputersModule` (to validate target exists and prevent self-hack)

**Module Configuration:**
```typescript
@Module({
  imports: [PlayersModule, ComputersModule],
  providers: [HackOperationRepository, InitiateHackUseCase],
  controllers: [HacksController],
  exports: [HackOperationRepository, InitiateHackUseCase],
})
export class HacksModule {}
```

---

### 5. Progression Module
**Path:** `apps/backend/src/modules/progression/`

**Responsibilities:**
- Progression unlock creation
- Unlock requirement validation
- Duplicate unlock prevention

**Application Layer:**
- **Services:** None
- **Use-Cases:**
  - `UnlockProgressionUseCase` - Unlock skill/tool/upgrade with validation
- **DTOs:**
  - `UnlockProgressionDto` - Unlock request
  - `ProgressionUnlockDto` - Unlock response

**Presentation Layer:**
- **Controllers:**
  - `ProgressionController`
    - `POST /progression/unlocks` (201 Created, @UseGuards(JwtAuthGuard))

**Exports:**
- `ProgressionUnlockRepository`
- `UnlockProgressionUseCase`

**Dependencies:**
- `PlayersModule` (to validate player exists)

**Module Configuration:**
```typescript
@Module({
  imports: [PlayersModule],
  providers: [ProgressionUnlockRepository, UnlockProgressionUseCase],
  controllers: [ProgressionController],
  exports: [ProgressionUnlockRepository, UnlockProgressionUseCase],
})
export class ProgressionModule {}
```

---

## Common Module

**Path:** `apps/backend/src/common/`

**Responsibilities:**
- Cross-cutting authentication concerns
- Guards and strategies
- Interceptors (future)
- Exception filters (future)

**Current Contents:**
- **Strategies:**
  - `JwtStrategy` - JWT validation with user existence check
- **Guards:**
  - `JwtAuthGuard` - JWT authorization enforcement

**Usage:** Guards applied via `@UseGuards(JwtAuthGuard)` on protected endpoints

---

## Module Dependency Graph

```
┌─────────────────┐
│  UsersModule    │
│  (no deps)      │
└─────────────────┘
        ↓ exports UserRepository
        ↓ exports AuthService
        ↓
┌─────────────────┐
│ PlayersModule   │
│  (no deps)      │
└─────────────────┘
        ↓ exports PlayerRepository
        ↓ exports Use-Cases
        ↓
┌─────────────────┐      ┌──────────────────┐
│ HacksModule     │ ←───│ ComputersModule  │
│  (imports       │      │  (no deps)       │
│   Players,      │      └──────────────────┘
│   Computers)    │              ↓ exports ComputerRepository
└─────────────────┘              ↓ exports Use-Cases
        ↑                         ↓
        │                         ↓
        │                ┌────────────────────┐
        └────────────────│ ProgressionModule  │
                         │  (imports Players) │
                         └────────────────────┘
```

**Dependency Rules:**
1. No circular dependencies (enforced by NestJS)
2. Feature modules import only what they need (exports)
3. Common module has no business logic dependencies
4. Domain layer has no NestJS framework dependencies

---

## File Naming Conventions

All files follow NestJS conventions:

| Layer | Pattern | Example |
|-------|---------|---------|
| Controller | `*.controller.ts` | `users.controller.ts` |
| Service | `*.service.ts` | `auth.service.ts` |
| Use-Case | `*.usecase.ts` | `create-player.usecase.ts` |
| DTO | `*.dto.ts` | `create-user.dto.ts` |
| Guard | `*.guard.ts` | `jwt.guard.ts` |
| Strategy | `*.strategy.ts` | `jwt.strategy.ts` |
| Module | `*.module.ts` | `users.module.ts` |

---

## Request Flow Example

### POST /hacks/:computerId/start

**1. HTTP Layer (Presentation)**
```
Client → HacksController
  @Post(':computerId/start')
  @UseGuards(JwtAuthGuard)
```

**2. Guard Validation**
```
JwtAuthGuard → JwtStrategy
  - Validates JWT token
  - Extracts user from payload
  - Verifies user.isActive
  - Injects user into request.user
```

**3. DTO Validation**
```
ValidationPipe → InitiateHackDto
  - @IsEnum(HackType) hackType
  - @IsArray() tools
```

**4. Use-Case Orchestration (Application)**
```
InitiateHackUseCase.execute()
  - Validates attacker exists (PlayerRepository)
  - Validates target exists (ComputerRepository)
  - **Server-authoritative**: Prevents self-hack (attackerId !== targetOwnerId)
  - Creates HackOperation entity (Domain)
  - Persists (HackOperationRepository)
  - Returns HackOperation
```

**5. DTO Transformation**
```
Controller.hackToDto(hackOperation)
  - Converts domain entity to HackOperationDto
  - Returns to client
```

**6. Response**
```
202 Accepted
{
  "hackId": "...",
  "attackerId": "...",
  "targetComputerId": "...",
  "hackType": "EXPLOIT",
  "status": "PENDING",
  ...
}
```

---

## Cross-Cutting Concerns

### Authentication Flow
1. User registers: `POST /auth/register` → `AuthService.register()`
2. User logs in: `POST /auth/login` → `AuthService.login()`
3. Server generates JWT (accessToken + refreshToken)
4. Client stores tokens
5. Client sends accessToken in `Authorization: Bearer <token>` header
6. `JwtAuthGuard` intercepts protected requests
7. `JwtStrategy` validates token and user state
8. Controller receives authenticated user in `request.user`

### Validation Flow
1. Client sends request with DTO
2. `ValidationPipe` (global) validates DTO
3. `class-validator` decorators enforce constraints
4. Invalid requests return `400 Bad Request`
5. Valid requests proceed to controller

### Error Handling Flow
1. Use-case throws domain exception (e.g., `throw new Error('Self-hack forbidden')`)
2. NestJS exception filter catches exception
3. Returns appropriate HTTP status code and JSON error response
4. Client receives structured error

---

## Server-Authoritative Patterns

**1. Self-Hack Prevention** (HacksModule)
```typescript
// Server validates ownership
const targetComputer = await this.computerRepository.findById(targetComputerId);
const attacker = await this.playerRepository.findById(attackerId);

if (targetComputer.getPlayerId() === attackerId) {
  throw new Error('Cannot hack your own computer');
}
```

**2. Resource Validation** (InstallDefenseUseCase)
```typescript
// Server validates ownership before state change
const computer = await this.computerRepository.findById(computerId);
if (computer.getPlayerId() !== userId) {
  throw new Error('Not authorized to modify this computer');
}
```

**3. Duplicate Prevention** (All Use-Cases)
```typescript
// Server checks for existing records
const existing = await this.playerRepository.findByUserId(userId);
if (existing) {
  throw new Error('Player already exists for this user');
}
```

---

## Future Enhancements

### Planned (Next Sprint)
1. **Exception Filters** - Global error handling with consistent responses
2. **Logging Interceptor** - Request/response logging for audit
3. **WebSocket Gateway** - Real-time event broadcasting
4. **Rate Limiting Guard** - Prevent abuse of API endpoints

### Long-Term
5. **Caching Interceptor** - Cache frequently accessed data
6. **Swagger Documentation** - Auto-generated API docs
7. **Health Check Module** - Endpoint for monitoring
8. **Database Migrations** - Version-controlled schema changes

---

## Module Testing Strategy

### Unit Tests
- **Services:** Mock repositories, test business logic
- **Use-Cases:** Mock repositories and dependencies, test orchestration
- **Controllers:** Mock use-cases, test HTTP layer

### Integration Tests
- **Module:** Test with real providers, mock database
- **E2E:** Test full request flow with test database

### Example (Create Player Use-Case Test)
```typescript
describe('CreatePlayerUseCase', () => {
  it('should create player for authenticated user', async () => {
    const mockPlayerRepo = {
      findByUserId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(createdPlayer),
    };

    const useCase = new CreatePlayerUseCase(mockPlayerRepo);
    const result = await useCase.execute('userId', 'PlayerName');

    expect(result.getDisplayName()).toBe('PlayerName');
    expect(mockPlayerRepo.save).toHaveBeenCalledTimes(1);
  });
});
```

---

## Conclusion

The module structure follows NestJS and DDD best practices with:
- Clear separation of concerns (domain, application, presentation)
- Explicit dependencies via NestJS DI
- Server-authoritative game logic
- Contract-first API design
- Consistent file naming and organization

All modules are production-ready with complete implementation of services, use-cases, DTOs, and controllers.
