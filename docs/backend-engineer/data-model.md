/**
 * Backend Engineer - Data Model Documentation
 *
 * This document outlines the persistence strategy and mapping
 * between domain and infrastructure layers.
 */

# Data Model & Persistence Strategy

## Overview

The NetWatch backend uses a **pragmatic Domain-Driven Design (DDD)** approach with clear separation between domain logic (pure) and persistence (infrastructure).

**Core Principle:** One table per aggregate root. One mapper per aggregate.

---

## Aggregate Root → Table Mapping

### 1. User Aggregate

**Aggregate Root:** `User`  
**Table:** `users`  
**Persistence Location:** `apps/backend/src/modules/users/infrastructure/`

**Mapping Flow:**

```
User (Domain)
  ↓ UserMapper.toPersistence()
UserEntity (TypeORM)
  ↓ TypeORM save/load
users (Database)
  ↓ UserMapper.toDomain()
User (Domain)
```

**Key Points:**
- Username immutable after creation
- Password stored as hash (bcrypt)
- Soft delete via `is_active` flag
- `last_login_at` tracked for analytics

**Mapper:** [user.mapper.ts](../../apps/backend/src/infrastructure/mappers/user.mapper.ts)  
**Repository:** [user.repository.ts](../../apps/backend/src/modules/users/infrastructure/persistence/user.repository.ts)

---

### 2. Player Aggregate

**Aggregate Root:** `Player`  
**Table:** `players`  
**Contains:** ProgressionUnlock (child entity)  
**Persistence Location:** `apps/backend/src/modules/players/infrastructure/`

**Mapping Flow:**

```
Player (Domain)
  ├─ Money (value object) → money (bigint)
  ├─ Energy (value object) → energy (int) + energy_max (int)
  └─ Level (computed) → GENERATED ALWAYS AS floor(sqrt(experience/100))

player (Database)
  ↓ PlayerMapper.toDomain()
Player (Domain with reconstructed value objects)
```

**Key Points:**
- 1:1 with User (enforced by UNIQUE constraint on user_id)
- Level is read-only computed column (no manual updates)
- Money stored as `bigint` (handles large values safely)
- Experience stored as `bigint` (allows level up to 1000+ theoretically)

**Mapper:** [player.mapper.ts](../../apps/backend/src/infrastructure/mappers/player.mapper.ts)  
**Repository:** [player.repository.ts](../../apps/backend/src/modules/players/infrastructure/persistence/player.repository.ts)

---

### 3. Computer Aggregate

**Aggregate Root:** `Computer`  
**Table:** `computers`  
**Contains:** Defense (child entity)  
**Persistence Location:** `apps/backend/src/modules/computers/infrastructure/`

**Mapping Flow:**

```
Computer (Domain)
  └─ Name, IP, Resources, Firewall, Online status

computers (Database)
  ↓ ComputerMapper.toDomain()
Computer (Domain with reconstructed invariants)
```

**Key Points:**
- Each player must have ≥1 computer (enforced at application level)
- IP address globally unique (prevents collisions)
- `is_online` status: offline computers cannot be hacked
- `firewall_level`: base defense (0-100), increased via upgrades

**Mapper:** [computer.mapper.ts](../../apps/backend/src/infrastructure/mappers/computer.mapper.ts)  
**Repository:** [computer.repository.ts](../../apps/backend/src/modules/computers/infrastructure/persistence/computer.repository.ts)

---

### 4. Defense Aggregate (Child of Computer)

**Parent:** Computer  
**Table:** `defenses`  
**Persistence Location:** `apps/backend/src/modules/computers/infrastructure/`

**Mapping Flow:**

```
Defense (Domain)
  └─ Type (enum), Level (1-5)

defenses (Database)
  ↓ DefenseMapper.toDomain()
Defense (Domain)
```

**Key Points:**
- One defense type per computer (UNIQUE constraint on `computer_id`, `defense_type`)
- Level upgradeable (1 → 5)
- Loaded with Computer aggregate (eager load via relations)

**Mapper:** [defense.mapper.ts](../../apps/backend/src/infrastructure/mappers/defense.mapper.ts)  
**Repository:** [defense.repository.ts](../../apps/backend/src/modules/computers/infrastructure/persistence/defense.repository.ts)

---

### 5. HackOperation Aggregate

**Aggregate Root:** `HackOperation`  
**Table:** `hack_operations`  
**Persistence Location:** `apps/backend/src/modules/hacks/infrastructure/`

**Mapping Flow:**

```
HackOperation (Domain)
  ├─ Status (enum: pending → in_progress → succeeded/failed/aborted)
  ├─ HackType (enum)
  ├─ ToolsUsed (string array in JSONB)
  └─ ResultData (JSONB object, populated on completion)

hack_operations (Database)
  ↓ HackOperationMapper.toDomain()
HackOperation (Domain)
```

**Key Points:**
- JSONB `tools_used`: `["port_scanner", "exploit_kit", ...]`
- JSONB `result_data`: `{ successRoll, resourcesStolen, detectedByTarget, xpGranted }`
- Status transitions are unidirectional (enforced in domain)
- `completion_at` determines when hack is ready to resolve
- Server processes completions via scheduled job or on-demand query

**Mapper:** [hack-operation.mapper.ts](../../apps/backend/src/infrastructure/mappers/hack-operation.mapper.ts)  
**Repository:** [hack-operation.repository.ts](../../apps/backend/src/modules/hacks/infrastructure/persistence/hack-operation.repository.ts)

---

### 6. ProgressionUnlock Aggregate (Child of Player)

**Parent:** Player  
**Table:** `progression_unlocks`  
**Persistence Location:** `apps/backend/src/modules/progression/infrastructure/`

**Mapping Flow:**

```
ProgressionUnlock (Domain)
  └─ Type (enum), Key (string), UnlockedAt (timestamp)

progression_unlocks (Database)
  ↓ ProgressionUnlockMapper.toDomain()
ProgressionUnlock (Domain)
```

**Key Points:**
- One unlock per player per key (UNIQUE constraint)
- Unlocks are permanent (no revocation in MVP)
- `unlock_key` references catalog (e.g., "port_scanner", "firewall_tier_2")

**Mapper:** [progression-unlock.mapper.ts](../../apps/backend/src/infrastructure/mappers/progression-unlock.mapper.ts)  
**Repository:** [progression-unlock.repository.ts](../../apps/backend/src/modules/progression/infrastructure/persistence/progression-unlock.repository.ts)

---

## Value Objects → Columns

### Money

**Domain Class:** `Money` (immutable, wraps `bigint`)  
**Storage:** `money BIGINT` column

**Mapping:**
```typescript
Money.create(row.money) // Reconstruct on load
player.getMoney().toNumber() // Flatten on save
```

**Rationale:** Bigint safely handles large game currencies without overflow.

---

### Energy

**Domain Class:** `Energy` (immutable, tracks current + max)  
**Storage:** `energy INTEGER` + `energy_max INTEGER` columns

**Mapping:**
```typescript
Energy.create(row.energy, row.energy_max) // Reconstruct on load
player.getEnergy().getCurrent() // Flatten on save
player.getEnergy().getMax() // Flatten on save
```

**Rationale:** Separate columns for clear semantics; `Energy` enforces constraint (current ≤ max).

---

## Repository Pattern

### Rules

1. **One repository per aggregate root** (User, Player, Computer, HackOperation, ProgressionUnlock)
2. **Repositories are injectable NestJS services** (use `@Injectable()`)
3. **Repositories depend on TypeORM `DataSource`** for query execution
4. **Repositories are private to their module** (not exported, not used cross-module)
5. **Cross-module coordination via services/use-cases** (not direct repository calls)

### Example: PlayerRepository

```typescript
@Injectable()
export class PlayerRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findById(id: string): Promise<Player | null> {
    const raw = await this.repository.findOne({ where: { id } });
    return raw ? PlayerMapper.toDomain(raw) : null;
  }

  async create(player: Player): Promise<Player> {
    const raw = await this.repository.save(PlayerMapper.toPersistence(player));
    return PlayerMapper.toDomain(raw);
  }

  // Query methods for specific use-cases
  async findByUserId(userId: string): Promise<Player | null> { }
  async getTopPlayersByLevel(limit: number): Promise<Player[]> { }
}
```

---

## Transactional Consistency

### Single-Aggregate Transactions

Most operations touch a single aggregate root:

```typescript
// Create player character (atomic)
const player = Player.create(id, userId, displayName);
await playerRepository.create(player);
// → No transaction needed; TypeORM handles atomicity
```

### Multi-Aggregate Transactions

Operations spanning multiple aggregates use TypeORM transactions:

```typescript
await dataSource.transaction(async (manager) => {
  // 1. Create hack operation
  const hack = HackOperation.create(...);
  const savedHack = await hackRepository.create(hack);

  // 2. Deduct attacker energy
  const attacker = await playerRepository.findById(attackerId);
  const updated = attacker.consumeEnergy(cost);
  await playerRepository.update(updated);

  // 3. All-or-nothing
});
```

---

## Change Data Capture (Future)

The system is designed for eventual CDC (Change Data Capture):

```sql
-- Example: Track mutations for event sourcing
CREATE TABLE event_log (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type VARCHAR(50),
  aggregate_id UUID,
  event_type VARCHAR(100),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers on each table to log changes
CREATE TRIGGER players_change_log
AFTER INSERT OR UPDATE ON players
FOR EACH ROW EXECUTE FUNCTION log_change();
```

---

## Indexing Strategy

See [indexing-strategy.md](../database-architect/indexing-strategy.md) for full index definitions and rationale.

**Quick Reference:**

| Table | Index | Rationale |
| --- | --- | --- |
| users | email, created_at | Email lookups, account audit |
| players | user_id (unique), level, created_at | 1:1 lookup, leaderboard, timeline |
| computers | owner_id, ip_address (unique), is_online | Owner listing, target lookup, online filtering |
| defenses | computer_id, (computer_id, defense_type) unique | Computer defense load, unique constraint |
| hack_operations | attacker_id, target_computer_id, status, completion_at | Filtering by role, status queries, cleanup jobs |
| progression_unlocks | player_id, unlock_key | Unlock checks, catalog |

---

## Migration Strategy

See [migration-strategy.md](../database-architect/migration-strategy.md) for full process.

**Quick Reference:**

1. **Create migration file:** `YYYYMMDD_HHmmss_description.sql`
2. **Test locally:** `pnpm run migrate:test`
3. **Review schema:** `pnpm run schema:check`
4. **Deploy:** Migrations run automatically on startup (dev mode only; prod requires explicit approval)

---

## Testing Data Access

### Unit Test Example

```typescript
describe('PlayerRepository', () => {
  let repository: PlayerRepository;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PlayerRepository,
        {
          provide: DataSource,
          useValue: mockDataSource, // Mock TypeORM
        },
      ],
    }).compile();

    repository = module.get(PlayerRepository);
  });

  it('should map domain player to persistence and back', async () => {
    const player = Player.create(createPlayerId('123'), 'user-1', 'TestPlayer');
    await repository.create(player);
    
    const loaded = await repository.findById('123');
    expect(loaded?.getDisplayName()).toBe('TestPlayer');
  });
});
```

---

## Cross-Cutting Concerns

### Soft Deletes

User accounts use soft delete (is_active flag). When querying:

```typescript
// Active users only
const activeUsers = await userRepository.find({
  where: { is_active: true },
});
```

### Audit Timestamps

All aggregates track `created_at` (immutable after creation). Some track `updated_at` (future).

```typescript
user.getCreatedAt() // Always available
```

### Computed Columns

Player `level` is a computed column (SQL GENERATED):

```typescript
// In database
level = FLOOR(SQRT(experience / 100.0))

// In domain (computed on-demand)
player.getLevel() // Returns same value
```

---

## Summary

| Layer | Artifact | Location | Responsibility |
| --- | --- | --- | --- |
| Domain | Entity classes | `packages/domain/src/entities/` | Immutability, invariants, behavior |
| Value Objects | Money, Energy, etc. | `packages/domain/src/value-objects/` | Type-safe primitives |
| TypeORM | Entity definitions | `apps/backend/src/infrastructure/database/entities/` | Column mappings, relationships |
| Mappers | Conversion logic | `apps/backend/src/infrastructure/mappers/` | Domain ↔ Persistence |
| Repository | Data access | `apps/backend/src/modules/*/infrastructure/persistence/` | CRUD + queries |
| Module | Service/Controller | `apps/backend/src/modules/*/` | Orchestration, use-cases |

This layered approach ensures:
- **Domain purity** (no framework coupling)
- **Persistence independence** (swap TypeORM for another ORM)
- **Testability** (mock repositories easily)
- **Maintainability** (clear boundaries)
