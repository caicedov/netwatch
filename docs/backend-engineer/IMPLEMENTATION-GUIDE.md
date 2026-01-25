# Implementation Guide: Persistence & Real-Time Features

**Target**: Enable production-ready persistence testing and real-time game mechanics  
**Effort Estimate**: 27 hours total  
**Timeline**: 1-2 weeks for single developer

---

## Part 1: TD-002 - Persistence Integration Testing (11 hours)

### Overview

All repositories are fully implemented with TypeORM. Remaining work is verification and transaction safety for multi-aggregate operations.

### Checklist

#### 1.1 Verify Database Connection (1 hour)

**Goal**: Confirm PostgreSQL schema matches domain entities

**Steps**:
```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d postgres

# Terminal 2: Check connection
cd apps/backend
pnpm migration:show
# Expected output: List of migrations with "success" status
```

**Expected Output**:
```
 query: SELECT * FROM "typeorm_metadata" WHERE...
 
 ✓ database 192.168.1.1:5432

 ✓ 0001_initial_schema.ts
 ✓ 0002_add_game_tables.ts
 ✓ 0003_add_indexes.ts
```

**Files to Check**:
- [apps/backend/src/infrastructure/database/migrations/](apps/backend/src/infrastructure/database/migrations/)
- [ormconfig.js](ormconfig.js) or [typeorm.config.ts](typeorm.config.ts)

---

#### 1.2 Create Integration Test Suite (4 hours)

**Goal**: Verify repositories persist and retrieve data correctly

**Create**: [apps/backend/src/modules/users/infrastructure/persistence/__tests__/user.repository.integration.spec.ts](apps/backend/src/modules/users/infrastructure/persistence/__tests__/user.repository.integration.spec.ts)

```typescript
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserRepository } from '../user.repository';
import { UserEntity } from '../../../../infrastructure/database/entities/user.entity';
import { User, createUserId } from '@netwatch/domain';

describe('UserRepository (Integration)', () => {
  let dataSource: DataSource;
  let repository: UserRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_TEST_HOST || 'localhost',
          port: parseInt(process.env.DB_TEST_PORT || '5433'),
          database: process.env.DB_TEST_NAME || 'netwatch_test',
          username: process.env.DB_TEST_USER || 'postgres',
          password: process.env.DB_TEST_PASSWORD || 'postgres',
          entities: [UserEntity],
          synchronize: true, // Auto-migrate for tests
          dropSchema: true, // Clean slate before each test suite
        }),
        TypeOrmModule.forFeature([UserEntity]),
      ],
      providers: [UserRepository],
    }).compile();

    dataSource = module.get(DataSource);
    repository = module.get(UserRepository);
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should create and retrieve user', async () => {
    const userId = createUserId();
    const user = User.create(
      userId,
      'testuser',
      'test@example.com',
      'hashedpassword',
    );

    const created = await repository.create(user);
    expect(created.getId()).toBe(userId);

    const retrieved = await repository.findById(userId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.getUsername()).toBe('testuser');
    expect(retrieved!.getEmail()).toBe('test@example.com');
  });

  it('should find user by username', async () => {
    const user = User.create(
      createUserId(),
      'alice',
      'alice@example.com',
      'hashedpassword',
    );
    await repository.create(user);

    const found = await repository.findByUsername('alice');
    expect(found).not.toBeNull();
    expect(found!.getId()).toBe(user.getId());
  });

  it('should update user', async () => {
    const user = User.create(
      createUserId(),
      'bob',
      'bob@example.com',
      'hashedpassword',
    );
    const created = await repository.create(user);

    // Simulate user verification
    const updated = User.fromPersistence(
      created.getId(),
      created.getUserId(),
      'bob',
      'bob@example.com',
      'newhash',
      true, // isEmailVerified
    );
    const result = await repository.update(updated);
    expect(result.isEmailVerified()).toBe(true);
  });

  it('should delete user', async () => {
    const user = User.create(
      createUserId(),
      'charlie',
      'charlie@example.com',
      'hashedpassword',
    );
    const created = await repository.create(user);

    await repository.delete(created.getId());

    const found = await repository.findById(created.getId());
    expect(found).toBeNull();
  });
});
```

**Repeat for**: PlayerRepository, ComputerRepository, HackOperationRepository, ProgressionUnlockRepository

**Tips**:
- Use separate test database (e.g., port 5433 for testing, 5432 for dev)
- Set `synchronize: true` to auto-create schema
- Use `dropSchema: true` to start clean
- Test both happy paths and edge cases

---

#### 1.3 Add Transaction Support (3 hours)

**Goal**: Ensure multi-aggregate operations (CreatePlayer + CreateComputer) are atomic

**Location**: [apps/backend/src/modules/players/application/usecases/create-player.usecase.ts](apps/backend/src/modules/players/application/usecases/create-player.usecase.ts)

**Current Code (No Transaction)**:
```typescript
async execute(userId: string, username: string): Promise<Player> {
  const player = Player.create(createPlayerId(), userId, username);
  
  // If app crashes here, player created but no default computer
  const saved = await this.playerRepository.create(player);
  
  // This may fail if user already has player (should be checked first)
  const defaultComputer = Computer.create(
    createComputerId(),
    saved.getId(),
    'Home Server',
  );
  await this.computerRepository.create(defaultComputer);
  
  return saved;
}
```

**Fixed Code (With Transaction)**:
```typescript
constructor(
  private readonly playerRepository: PlayerRepository,
  private readonly computerRepository: ComputerRepository,
  private readonly dataSource: DataSource, // Add this
) {}

async execute(userId: string, username: string): Promise<Player> {
  // Start transaction
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Create player
    const player = Player.create(createPlayerId(), userId, username);
    const savedPlayer = await this.playerRepository.create(player);

    // Create default computer for player
    const defaultComputer = Computer.create(
      createComputerId(),
      savedPlayer.getId(),
      'Home Server',
    );
    await this.computerRepository.create(defaultComputer);

    // Commit only if both succeed
    await queryRunner.commitTransaction();
    return savedPlayer;
  } catch (error) {
    // Rollback if anything fails
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    // Clean up query runner
    await queryRunner.release();
  }
}
```

**Alternatively (Simpler)**: Use TypeORM transaction decorator:
```typescript
@Transaction()
async execute(
  @TransactionManager() entityManager: EntityManager,
  userId: string,
  username: string,
): Promise<Player> {
  // Both operations use same entityManager
  const player = await entityManager.save(Player.create(...));
  const computer = await entityManager.save(Computer.create(...));
  return player;
}
```

**Apply to**:
- CreatePlayerUseCase (creates player + default computer)
- InstallDefenseUseCase (may involve resource deduction + defense creation)
- Any use-case touching multiple aggregates

---

#### 1.4 Validate Schema & Field Mappings (2 hours)

**Goal**: Ensure all entity fields map correctly to database columns

**Checklist**:
- ✅ Defense entity has `effectiveness` column (added this session)
- ✅ Player entity has `energy` and `energy_max` (flat fields stored)
- ✅ Computer entity has `storage`, `cpu`, `memory` fields
- ✅ Hack operation has `completion_at` field

**Verification**:
```bash
# Check PostgreSQL schema
docker exec netwatch-postgres psql -U postgres -d netwatch -c "\d defenses"

# Expected:
# Column     │ Type         │
# ───────────┼──────────────┤
# id         │ uuid         │
# computer_id│ uuid         │
# type       │ enum         │
# level      │ integer      │
# effectiveness│ numeric(5,2)│  ← VERIFY THIS EXISTS
# installed_at│ timestamptz │
```

**Manual Check**:
```typescript
// In test file
it('should have effectiveness column', async () => {
  const defense = await repository.create(new Defense(...));
  const raw = await dataSource.query('SELECT * FROM defenses WHERE id = $1', [defense.id]);
  expect(raw[0].effectiveness).toBeDefined();
  expect(typeof raw[0].effectiveness).toBe('number');
});
```

---

### Testing Command

```bash
# Run integration tests
cd apps/backend
pnpm test:integration

# Or specific file
pnpm test -- --testPathPattern="user.repository.integration"

# With coverage
pnpm test:cov -- --testPathPattern="infrastructure/persistence"
```

---

## Part 2: TD-003 - WebSocket Gateway Implementation (16 hours)

### Overview

Add real-time bidirectional communication for live game updates. Players see hack progress, defense installations, and resource changes instantly.

### Architecture

```
UseCase emits domain event
    ↓
EventListener catches event
    ↓
GamesGateway broadcasts to Socket.IO room
    ↓
Connected clients receive update in real-time
```

### Checklist

#### 2.1 Install Dependencies (30 minutes)

```bash
cd apps/backend
pnpm add @nestjs/websockets socket.io
pnpm add --save-dev @types/socket.io
```

#### 2.2 Create WebSocket Gateway (3 hours)

**Location**: [apps/backend/src/common/websocket/games.gateway.ts](apps/backend/src/common/websocket/games.gateway.ts)

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway for Real-Time Game Updates
 *
 * - Maintains connections per player
 * - Broadcasts game state changes (hacks, defenses, resources)
 * - Handles reconnection with full state sync
 * - Enforces JWT authentication
 */
@WebSocketGateway({
  namespace: '/games',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@Injectable()
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private playerSessions = new Map<string, string>(); // playerId -> socketId
  private socketToPlayer = new Map<string, string>(); // socketId -> playerId

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      // Extract JWT from query params or headers
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT and extract playerId
      const decoded = this.jwtService.verify(token) as { sub: string; userId: string };
      const playerId = decoded.sub; // Or userId, depending on your JWT structure

      // Register session
      this.playerSessions.set(playerId, client.id);
      this.socketToPlayer.set(client.id, playerId);

      // Join personal room for targeted broadcasts
      client.join(`player:${playerId}`);

      console.log(`[Gateway] Player ${playerId} connected (socket ${client.id})`);

      // Notify client of successful connection
      client.emit('connected', { playerId, timestamp: new Date() });
    } catch (error) {
      console.error('[Gateway] Auth failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const playerId = this.socketToPlayer.get(client.id);
    if (playerId) {
      this.playerSessions.delete(playerId);
      this.socketToPlayer.delete(client.id);
      console.log(`[Gateway] Player ${playerId} disconnected`);
    }
  }

  /**
   * Client requests full player state after reconnect.
   * Returns: current computers, active hacks, resources, defenses
   */
  @SubscribeMessage('request-state')
  async handleRequestState(
    client: Socket,
    payload: { playerId: string },
  ): Promise<any> {
    const playerId = this.socketToPlayer.get(client.id);
    if (playerId !== payload.playerId) {
      throw new UnauthorizedException('Mismatched playerId');
    }

    // TODO: Call GetPlayerProfileUseCase to fetch current state
    return {
      event: 'player-state',
      data: {
        playerId,
        computers: [],
        activeHacks: [],
        resources: { money: 1000, energy: { current: 100, max: 100 } },
      },
    };
  }

  // ============================================
  // Public Methods Called by Use-Cases/Services
  // ============================================

  /**
   * Broadcast hack initiated to target computer defenders + attacker
   */
  broadcastHackInitiated(hackId: string, attackerId: string, targetComputerId: string) {
    this.server.to(`computer:${targetComputerId}`).emit('hack-initiated', {
      hackId,
      attackerId,
      timestamp: new Date(),
    });

    // Also notify attacker
    const attackerSocketId = this.playerSessions.get(attackerId);
    if (attackerSocketId) {
      this.server.to(attackerSocketId).emit('hack-started', {
        hackId,
        targetComputerId,
        status: 'RUNNING',
      });
    }
  }

  /**
   * Broadcast hack progress update
   */
  broadcastHackProgress(hackId: string, progress: number, targetComputerId: string) {
    this.server.emit('hack-progress', {
      hackId,
      progress,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast hack completion with result
   */
  broadcastHackCompleted(
    hackId: string,
    attackerId: string,
    targetComputerId: string,
    success: boolean,
    result: Record<string, any>,
  ) {
    // All connected clients (watchers)
    this.server.emit('hack-completed', {
      hackId,
      attackerId,
      targetComputerId,
      success,
      result,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast defense installed on computer
   */
  broadcastDefenseInstalled(
    computerId: string,
    defensDto: any, // DefenseDto
  ) {
    // Notify all players watching this computer
    this.server.to(`computer:${computerId}`).emit('defense-installed', {
      computerId,
      defense: defensDto,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast resource changes (money, energy, etc.)
   */
  broadcastResourcesUpdated(playerId: string, resources: any) {
    this.server.to(`player:${playerId}`).emit('resources-updated', {
      playerId,
      resources,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast progression unlock
   */
  broadcastUnlockProgression(playerId: string, unlock: any) {
    this.server.to(`player:${playerId}`).emit('progression-unlocked', {
      unlockKey: unlock.key,
      name: unlock.name,
      timestamp: new Date(),
    });
  }
}
```

**Register in Module**:

[apps/backend/src/common/common.module.ts](apps/backend/src/common/common.module.ts):
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GamesGateway } from './websocket/games.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [GamesGateway],
  exports: [GamesGateway],
})
export class CommonModule {}
```

---

#### 2.3 Emit Events from Use-Cases (4 hours)

**Goal**: Trigger WebSocket broadcasts when state changes

**Example**: [apps/backend/src/modules/hacks/application/usecases/initiate-hack.usecase.ts](apps/backend/src/modules/hacks/application/usecases/initiate-hack.usecase.ts)

```typescript
import { EventEmitter2 } from 'eventemitter2'; // Or @nestjs/event-emitter

export class InitiateHackUseCase {
  constructor(
    private readonly hackRepository: HackOperationRepository,
    private readonly eventEmitter: EventEmitter2, // Add this
  ) {}

  async execute(
    attackerId: string,
    targetComputerId: string,
    hackType: string,
    tools: string[],
  ): Promise<HackOperation> {
    // Validate
    const targetComputer = await this.computerRepository.findById(targetComputerId);
    if (!targetComputer) {
      throw new Error('Computer not found');
    }

    // Create hack
    const hack = HackOperation.create(
      createHackOperationId(),
      attackerId,
      targetComputerId,
      hackType as any,
      tools,
    );

    // Persist
    await this.hackRepository.create(hack);

    // **Emit event for WebSocket broadcast**
    this.eventEmitter.emit('hack.initiated', {
      hackId: hack.getId(),
      attackerId,
      targetComputerId,
      timestamp: new Date(),
    });

    return hack;
  }
}
```

**Also Emit for**:
- InstallDefenseUseCase → `defense.installed`
- InitiateHackUseCase → `hack.initiated`, `hack.completed` (when hack finishes)
- CreateComputerUseCase → `computer.created`
- UnlockProgressionUseCase → `progression.unlocked`

---

#### 2.4 Add Event Listeners in Gateway (3 hours)

**Location**: [apps/backend/src/common/websocket/games.gateway.ts](apps/backend/src/common/websocket/games.gateway.ts)

```typescript
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({ ... })
export class GamesGateway {
  @OnEvent('hack.initiated')
  handleHackInitiated(payload: { hackId: string; attackerId: string; targetComputerId: string }) {
    this.broadcastHackInitiated(payload.hackId, payload.attackerId, payload.targetComputerId);
  }

  @OnEvent('defense.installed')
  handleDefenseInstalled(payload: { computerId: string; defense: any }) {
    this.broadcastDefenseInstalled(payload.computerId, payload.defense);
  }

  @OnEvent('hack.completed')
  handleHackCompleted(payload: {
    hackId: string;
    attackerId: string;
    targetComputerId: string;
    success: boolean;
    result: any;
  }) {
    this.broadcastHackCompleted(
      payload.hackId,
      payload.attackerId,
      payload.targetComputerId,
      payload.success,
      payload.result,
    );
  }
}
```

---

#### 2.5 Client Integration Example (2 hours reading/docs)

**Client Side** (React/Vue/Angular):

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000/games', {
  auth: { token: localStorage.getItem('authToken') },
});

socket.on('connected', (data) => {
  console.log('Connected:', data.playerId);
});

socket.on('hack-initiated', (data) => {
  console.log('Hack started on computer:', data.targetComputerId);
  // Update UI with hack progress
});

socket.on('hack-progress', (data) => {
  console.log('Hack progress:', data.progress);
  // Animate progress bar
});

socket.on('defense-installed', (data) => {
  console.log('New defense:', data.defense.type);
  // Add defense to UI
});

// Request full state on reconnect
socket.on('reconnect', () => {
  socket.emit('request-state', { playerId: getCurrentPlayerId() });
});
```

---

#### 2.6 WebSocket Integration Tests (4 hours)

**Location**: [apps/backend/src/common/websocket/__tests__/games.gateway.integration.spec.ts](apps/backend/src/common/websocket/__tests__/games.gateway.integration.spec.ts)

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Socket as ClientSocket, io } from 'socket.io-client';
import { GamesGateway } from '../games.gateway';
import { EventEmitter2 } from 'eventemitter2';

describe('GamesGateway (Integration)', () => {
  let app: INestApplication;
  let gateway: GamesGateway;
  let clientSocket: ClientSocket;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [GamesGateway, EventEmitter2],
    }).compile();

    app = module.createNestApplication();
    gateway = module.get(GamesGateway);
    await app.listen(3001);
  });

  afterAll(async () => {
    clientSocket?.disconnect();
    await app.close();
  });

  it('should authenticate and connect', async () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    clientSocket = io('http://localhost:3001/games', {
      auth: { token: jwt },
      reconnection: false,
    });

    const connected = await new Promise((resolve) => {
      clientSocket.on('connected', (data) => resolve(data));
    });

    expect(connected).toHaveProperty('playerId');
  });

  it('should broadcast hack-initiated', async () => {
    const hackInitiated = new Promise((resolve) => {
      clientSocket.on('hack-initiated', (data) => resolve(data));
    });

    // Emit domain event
    const eventEmitter = app.get(EventEmitter2);
    eventEmitter.emit('hack.initiated', {
      hackId: 'hack-123',
      attackerId: 'player-456',
      targetComputerId: 'computer-789',
    });

    const received = await hackInitiated;
    expect(received).toMatchObject({
      hackId: 'hack-123',
      attackerId: 'player-456',
    });
  });
});
```

---

### Testing Commands

```bash
# Run WebSocket tests
cd apps/backend
pnpm test -- --testPathPattern="games.gateway"

# Manual testing with socket.io-client CLI
pnpm add -g socket.io-client
io ws://localhost:3000/games
> {"auth":{"token":"jwt-token"}}
```

---

## Implementation Order & Timeline

### Week 1: Persistence (5-6 days)
- **Day 1-2**: Integration test setup + UserRepository tests (8h)
- **Day 2-3**: Remaining repository tests (6h)
- **Day 3-4**: Transaction support (3h)
- **Day 4-5**: Run migrations and validate schema (2h)

### Week 2: Real-Time (5-6 days)
- **Day 1**: Gateway setup + authentication (4h)
- **Day 2**: Event emission from use-cases (4h)
- **Day 3**: Event listeners in gateway (3h)
- **Day 4**: WebSocket integration tests (4h)
- **Day 5**: Client integration documentation (2h)

---

## Success Criteria

### TD-002 Complete When:
- ✅ All repository integration tests pass
- ✅ Transactions work for multi-aggregate operations
- ✅ `pnpm migration:show` shows all migrations successful
- ✅ Data persists across server restarts

### TD-003 Complete When:
- ✅ WebSocket gateway accepts authenticated connections
- ✅ Domain events broadcast to connected clients
- ✅ Clients receive real-time updates (hack progress, defense installed, etc.)
- ✅ Clients can request full state on reconnect
- ✅ Integration tests verify end-to-end flows

---

## Troubleshooting

### Database Issues
```bash
# Check migrations status
pnpm migration:show

# Reset database (warning: data loss)
pnpm migration:revert
pnpm migration:run

# View schema
docker exec netwatch-postgres psql -U postgres -d netwatch -c "\d"
```

### WebSocket Issues
```bash
# Check gateway is registered
# Add logs in handleConnection()
console.log('[Gateway] Player connected:', playerId);

# Verify Socket.IO is listening
curl -I http://localhost:3000/socket.io/?EIO=4&transport=polling

# Check CORS settings
# Ensure CLIENT_URL env var matches client domain
```

### Test Failures
```bash
# Run with verbose output
pnpm test -- --verbose

# Debug specific test
pnpm test -- --testNamePattern="should broadcast hack" --detectOpenHandles

# Check for hanging connections
# Ensure afterAll() calls dataSource.destroy() / socket.disconnect()
```

---

## Next Steps After Implementation

Once TD-002 and TD-003 are complete:
1. **TD-004**: Create exception filters for consistent error responses (9 hours)
2. **TD-005**: Write comprehensive automated tests (58 hours)
3. **TD-006**: Add structured logging (10 hours)

Then backend is **production-ready**.

---

**Last Updated**: 2026-01-24  
**Prepared By**: Backend Engineer Agent
