















/**
 * Backend Engineer - Testing Strategy Documentation
 *
 * This document outlines the testing approach for domain logic,
 * API contracts, and real-time event handling.
 */

# Testing Strategy

## Testing Pyramid

```
        /\
       /  \ E2E (5%)
      /    \ - Full game flows
     /──────\
    /        \ Integration (25%)
   /          \ - API + repository
  /────────────\
 /              \ Unit (70%)
/________________\ - Domain logic, repositories
```

---

## 1. Unit Tests (Domain Logic)

### Purpose

Validate domain invariants and behavior independently of persistence/HTTP.

### Location

```
packages/domain/src/entities/__tests__/
packages/domain/src/value-objects/__tests__/
```

### Example: Money Value Object

```typescript
describe('Money', () => {
  it('should create valid money', () => {
    const money = Money.create(100);
    expect(money.getValue()).toBe(100n);
  });

  it('should reject negative money', () => {
    expect(() => Money.create(-50)).toThrow('Money amount cannot be negative');
  });

  it('should add money correctly', () => {
    const a = Money.create(100);
    const b = Money.create(50);
    const sum = a.add(b);
    expect(sum.getValue()).toBe(150n);
  });

  it('should subtract money with validation', () => {
    const a = Money.create(100);
    const b = Money.create(60);
    const result = a.subtract(b);
    expect(result.getValue()).toBe(40n);
  });

  it('should throw on insufficient funds', () => {
    const a = Money.create(50);
    const b = Money.create(100);
    expect(() => a.subtract(b)).toThrow('Insufficient funds');
  });

  it('should support equality comparison', () => {
    const a = Money.create(100);
    const b = Money.create(100);
    expect(a.equals(b)).toBe(true);
  });
});
```

### Example: Player Entity

```typescript
describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = Player.create(
      createPlayerId('p1'),
      'user-1',
      'TestPlayer'
    );
  });

  describe('invariants', () => {
    it('should reject empty display name', () => {
      expect(() => 
        Player.create(createPlayerId('p1'), 'user-1', '')
      ).toThrow('Display name must be 1-50 characters');
    });

    it('should enforce energy bounds', () => {
      expect(() => player.consumeEnergy(200)).toThrow('Insufficient energy');
    });
  });

  describe('resource management', () => {
    it('should consume energy', () => {
      const updated = player.consumeEnergy(30);
      expect(updated.getEnergy().getCurrent()).toBe(70);
    });

    it('should earn money', () => {
      const money = Money.create(100);
      const updated = player.earnMoney(money);
      expect(updated.getMoney().getValue()).toBe(100n);
    });

    it('should check affordability', () => {
      const cost = Money.create(50);
      expect(player.canAfford(cost)).toBe(false);
      
      const updated = player.earnMoney(Money.create(100));
      expect(updated.canAfford(cost)).toBe(true);
    });
  });

  describe('progression', () => {
    it('should gain experience', () => {
      const updated = player.gainExperience(1000n);
      expect(updated.getExperience()).toBe(1000n);
    });

    it('should compute level from experience', () => {
      // Level = floor(sqrt(experience/100))
      const updated = player.gainExperience(10000n); // Level 10
      expect(updated.getLevel()).toBe(10);
    });

    it('should grant skill points on level up', () => {
      const updated = player.addSkillPoints(5);
      expect(updated.getSkillPoints()).toBe(5);
    });
  });
});
```

### Example: HackOperation Entity

```typescript
describe('HackOperation', () => {
  it('should validate attacker vs target', () => {
    expect(() =>
      HackOperation.create(
        createHackOperationId('h1'),
        'attacker-1',
        'attacker-1', // Same as attacker!
        HackType.STEAL_MONEY,
        ['tool1'],
        60
      )
    ).toThrow('Cannot hack own computer');
  });

  it('should enforce status transitions', () => {
    const hack = HackOperation.create(
      createHackOperationId('h1'),
      'attacker',
      'target-computer',
      HackType.STEAL_MONEY,
      ['tool1'],
      60
    );

    // Valid: pending → in_progress
    const inProgress = hack.transition(HackStatus.IN_PROGRESS);
    expect(inProgress.getStatus()).toBe(HackStatus.IN_PROGRESS);

    // Valid: in_progress → succeeded
    const succeeded = inProgress.transition(HackStatus.SUCCEEDED, {
      successRoll: 75,
      resourcesStolen: 500n,
    });
    expect(succeeded.getStatus()).toBe(HackStatus.SUCCEEDED);

    // Invalid: succeeded → pending
    expect(() => succeeded.transition(HackStatus.PENDING)).toThrow(
      'Invalid transition'
    );
  });
});
```

---

## 2. Integration Tests (Repositories & Mappers)

### Purpose

Verify that domain objects are correctly persisted and reconstructed.

### Location

```
apps/backend/src/modules/*/infrastructure/__tests__/
```

### Setup: Test Database

Use an in-memory SQLite or separate test PostgreSQL database:

```typescript
// jest.config.js
module.exports = {
  // ...
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup-db.ts'],
};
```

```typescript
// test/setup-db.ts
import { DataSource } from 'typeorm';

let testDataSource: DataSource;

beforeAll(async () => {
  testDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'netwatch_test',
    entities: ['src/infrastructure/database/entities/*.ts'],
    synchronize: true,
  });
  await testDataSource.initialize();
});

afterAll(async () => {
  await testDataSource.dropDatabase();
  await testDataSource.destroy();
});

afterEach(async () => {
  // Truncate tables
  const entities = testDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = testDataSource.getRepository(entity.name);
    await repository.delete({});
  }
});
```

### Example: PlayerRepository Integration Test

```typescript
describe('PlayerRepository', () => {
  let repository: PlayerRepository;
  let dataSource: DataSource;

  beforeEach(async () => {
    const testModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forFeature([PlayerEntity, UserEntity])],
      providers: [
        PlayerRepository,
        {
          provide: DataSource,
          useValue: testDataSource, // Use test DB
        },
      ],
    }).compile();

    repository = testModule.get(PlayerRepository);
  });

  describe('roundtrip persistence', () => {
    it('should save and load player with immutable state', async () => {
      // Arrange
      const original = Player.create(
        createPlayerId('p1'),
        'user-123',
        'PlayerName'
      );

      // Act: Save
      const saved = await repository.create(original);

      // Assert: Roundtrip
      expect(saved.getId()).toBe(original.getId());
      expect(saved.getDisplayName()).toBe(original.getDisplayName());
      expect(saved.getEnergy().getCurrent()).toBe(100);

      // Act: Load
      const loaded = await repository.findById(saved.getId());

      // Assert: Fully reconstructed
      expect(loaded).not.toBeNull();
      expect(loaded!.getDisplayName()).toBe('PlayerName');
      expect(loaded!.getMoney().getValue()).toBe(0n);
      expect(loaded!.getLevel()).toBe(0);
    });

    it('should preserve complex state (money, experience)', async () => {
      let player = Player.create(createPlayerId('p1'), 'user-1', 'Test');
      player = player.earnMoney(Money.create(1000));
      player = player.gainExperience(5000n);

      await repository.create(player);
      const loaded = await repository.findById(player.getId());

      expect(loaded!.getMoney().getValue()).toBe(1000n);
      expect(loaded!.getExperience()).toBe(5000n);
      expect(loaded!.getLevel()).toBe(7); // floor(sqrt(5000/100))
    });

    it('should enforce unique user constraint', async () => {
      const p1 = Player.create(createPlayerId('p1'), 'user-1', 'P1');
      const p2 = Player.create(createPlayerId('p2'), 'user-1', 'P2');

      await repository.create(p1);

      await expect(repository.create(p2)).rejects.toThrow();
    });
  });

  describe('query methods', () => {
    it('should find player by user id', async () => {
      const player = Player.create(createPlayerId('p1'), 'user-1', 'Test');
      await repository.create(player);

      const found = await repository.findByUserId('user-1');
      expect(found).not.toBeNull();
      expect(found!.getDisplayName()).toBe('Test');
    });

    it('should list top players by level', async () => {
      const p1 = Player.create(createPlayerId('p1'), 'u1', 'P1');
      const p2 = Player.create(createPlayerId('p2'), 'u2', 'P2');
      const p3 = Player.create(createPlayerId('p3'), 'u3', 'P3');

      await repository.create(
        p1.gainExperience(10000n) // Level 10
      );
      await repository.create(
        p2.gainExperience(1000n) // Level 3
      );
      await repository.create(
        p3.gainExperience(40000n) // Level 20
      );

      const top2 = await repository.getTopPlayersByLevel(2);
      expect(top2[0].getLevel()).toBe(20);
      expect(top2[1].getLevel()).toBe(10);
    });
  });
});
```

---

## 3. API Contract Tests

### Purpose

Verify HTTP endpoints return correct status codes and schemas.

### Location

```
apps/backend/test/
```

### Example: Authentication API Test

```typescript
describe('Auth Endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService) // Mock DB
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('POST /auth/register', () => {
    it('should return 201 with user data on success', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'newuser',
          password: 'SecurePass123',
          email: 'user@example.com',
        })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body.username).toBe('newuser');
      expect(response.body.email).toBe('user@example.com');
    });

    it('should return 400 on invalid input', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'ab', // Too short
          password: 'weak',
        })
        .expect(400);
    });

    it('should return 409 on duplicate username', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'duplicate', password: 'Pass123' });

      // Second attempt
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'duplicate', password: 'Pass456' })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should return JWT on valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'SecurePass123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.expiresIn).toBe(3600);
    });

    it('should return 401 on invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
```

---

## 4. Real-time Event Tests

### Purpose

Verify WebSocket commands trigger correct server events.

### Location

```
apps/backend/test/realtime/
```

### Example: Hack Operation Event Test

```typescript
describe('Hack Operation Events', () => {
  let gateway: GameGateway;
  let hackService: HackOperationService;
  let socket: SocketIOClient;

  beforeAll(async () => {
    // Setup test server with WebSocket gateway
    const module = await Test.createTestingModule({
      providers: [GameGateway, HackOperationService, /* ... */],
    }).compile();

    gateway = module.get(GameGateway);
    hackService = module.get(HackOperationService);

    await gateway.server.listen(3001); // Test port
    socket = io('http://localhost:3001', { reconnection: false });
  });

  it('should emit HackOperationStarted on successful initiation', async () => {
    const listener = jest.fn();
    socket.on('HACK_OPERATION_STARTED', listener);

    socket.emit('INITIATE_HACK', {
      attackerId: 'a1',
      targetComputerId: 't1',
      hackType: 'steal_money',
      toolsUsed: ['tool1'],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HACK_OPERATION_STARTED',
        payload: expect.objectContaining({
          operationId: expect.any(String),
          attackerId: 'a1',
        }),
      })
    );
  });

  it('should emit ActionRejected on insufficient energy', async () => {
    const listener = jest.fn();
    socket.on('ACTION_REJECTED', listener);

    // Attacker with no energy
    socket.emit('INITIATE_HACK', {
      attackerId: 'broke-player',
      targetComputerId: 't1',
      hackType: 'steal_money',
      toolsUsed: ['tool1'],
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'INSUFFICIENT_ENERGY',
      })
    );
  });

  it('should emit HackOperationCompleted after duration elapses', async () => {
    const listener = jest.fn();
    socket.on('HACK_OPERATION_COMPLETED', listener);

    // Initiate 1-second hack
    socket.emit('INITIATE_HACK', {
      attackerId: 'a1',
      targetComputerId: 't1',
      hackType: 'steal_money',
      toolsUsed: ['tool1'],
    });

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HACK_OPERATION_COMPLETED',
        payload: expect.objectContaining({
          success: expect.any(Boolean),
          resourcesStolen: expect.any(Number),
        }),
      })
    );
  });
});
```

---

## 5. Determinism & Replay Testing

### Purpose

Ensure game logic is deterministic and replayable for consistency.

### Test

```typescript
describe('Determinism', () => {
  it('should produce same outcome for same inputs', () => {
    // Same seed should yield same success roll
    const seed1 = 12345;
    const roll1 = hackingRulesService.rollSuccess(seed1, attacker, target);

    const roll2 = hackingRulesService.rollSuccess(seed1, attacker, target);

    expect(roll1).toBe(roll2);
  });

  it('should replay hack result from stored seed', async () => {
    // Original hack
    const hack1 = HackOperation.create(
      createHackOperationId('h1'),
      'attacker',
      'target',
      HackType.STEAL_MONEY,
      ['tool1'],
      60
    );

    const result1 = await hackService.executeHack(hack1, seed = 999);
    // result1: { success: true, stolenAmount: 500, ... }

    // Replay with same seed
    const result2 = await hackService.executeHack(hack1, seed = 999);
    expect(result2).toEqual(result1);
  });
});
```

---

## Test Execution

### Commands

```bash
# Unit tests (domain)
pnpm test packages/domain

# Integration tests (backend)
pnpm test apps/backend

# E2E tests
pnpm test:e2e apps/backend

# Watch mode
pnpm test:watch

# Coverage
pnpm test --coverage
```

### Coverage Targets

| Layer | Target |
| --- | --- |
| Domain logic | 90%+ |
| Repositories | 80%+ |
| Services | 85%+ |
| Controllers | 70% (integration tests prioritized) |
| Overall | 80%+ |

---

## Key Testing Principles

1. **Test behavior, not implementation** — Test what domain objects do, not how.
2. **Isolate domain from infrastructure** — Mock repositories in service tests.
3. **Verify contracts** — API and event tests validate request/response shapes.
4. **Ensure determinism** — Game logic must be replayable with same seed.
5. **Cover happy + sad paths** — Test both success and error scenarios.
6. **Use test data builders** — Factory functions reduce test boilerplate.

```typescript
// Example test builder
function aPlayer() {
  return Player.create(
    createPlayerId(uuid()),
    uuid(),
    'TestPlayer'
  );
}

function aPlayerWith(level: number) {
  const exp = BigInt(Math.pow(level, 2) * 100); // Reverse formula
  return aPlayer().gainExperience(exp);
}

// Usage
const weakPlayer = aPlayer();
const strongPlayer = aPlayerWith(15);
```
