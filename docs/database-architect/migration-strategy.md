# Migration Strategy

## Overview

This document defines the schema migration strategy for NetWatch PostgreSQL database. Migrations must be safe, reversible, and support continuous deployment without downtime.

**Key Principles:**

- Version-controlled migration files
- Transactional DDL (PostgreSQL supports this)
- Backward-compatible changes preferred
- Tested rollback procedures
- Idempotent migrations (safe to run multiple times)

---

## Technology Choice: TypeORM Migrations

**Selected Tool:** TypeORM CLI migrations

**Rationale:**

- Integrated with TypeORM (already used for entities)
- TypeScript-based (consistent with codebase)
- Transactional DDL support
- Automatic migration generation from entity changes
- Built-in `up` and `down` methods

**Alternatives Considered:**

- **Flyway:** Java-based, requires separate tooling
- **Liquibase:** XML/YAML, less TypeScript-friendly
- **Knex.js:** Good alternative, but TypeORM already chosen

---

## Migration File Structure

### Naming Convention

```
migrations/
  1674567890123-CreateUsersTable.ts
  1674567890124-CreatePlayersTable.ts
  1674567890125-CreateComputersTable.ts
  1674567890126-CreateDefensesTable.ts
  1674567890127-CreateHackOperationsTable.ts
  1674567890128-CreateProgressionUnlocksTable.ts
  1674567890129-AddEnergyMaxToPlayers.ts
  1674567890130-AddPartialIndexOnComputersOnline.ts
```

**Format:** `{timestamp}-{DescriptiveName}.ts`

**Timestamp:** Unix milliseconds (ensures ordering)  
**Name:** PascalCase, descriptive (what the migration does)

---

### File Template

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1674567890123 implements MigrationInterface {
  name = "CreateUsersTable1674567890123";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "username" VARCHAR(20) UNIQUE NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE,
        "is_active" BOOLEAN DEFAULT true NOT NULL,
        "created_at" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        "last_login_at" TIMESTAMPTZ,
        CONSTRAINT "username_length" CHECK (char_length("username") BETWEEN 3 AND 20)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_email" ON "users"("email") WHERE "email" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_users_created" ON "users"("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users" CASCADE`);
  }
}
```

**Structure:**

- `up()`: Apply changes (create/alter/add)
- `down()`: Revert changes (drop/remove)
- Each query is a separate `await` for clarity

---

## Migration Categories

### 1. Initial Schema Creation

**Purpose:** Create all base tables on first deployment

**Files:**

- `CreateUsersTable.ts`
- `CreatePlayersTable.ts`
- `CreateComputersTable.ts`
- `CreateDefensesTable.ts`
- `CreateHackOperationsTable.ts`
- `CreateProgressionUnlocksTable.ts`

**Execution:** Run once on fresh database

**Rollback:** `DROP TABLE ... CASCADE` (only safe on empty DB)

---

### 2. Adding Columns

**Example:** Add energy regeneration tracking

```typescript
export class AddEnergyRegenToPlayers1674567890140 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" 
      ADD COLUMN "last_energy_regen_at" TIMESTAMPTZ DEFAULT NOW()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" 
      DROP COLUMN "last_energy_regen_at"
    `);
  }
}
```

**Safe:** `ADD COLUMN` with `DEFAULT` is non-blocking in PostgreSQL

**Rollback:** `DROP COLUMN` (safe if column not critical)

---

### 3. Creating Indexes

**Example:** Add index for leaderboard queries

```typescript
export class AddIndexPlayersLevel1674567890150 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Use CONCURRENTLY to avoid locking table
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY "idx_players_level" 
      ON "players"("level")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_players_level"`);
  }
}
```

**Note:** `CONCURRENTLY` cannot be used inside a transaction, so TypeORM will run this outside transaction.

**Safe:** Index creation doesn't block reads/writes with `CONCURRENTLY`

---

### 4. Adding Constraints

**Example:** Add check constraint after validating existing data

```typescript
export class AddMaxConcurrentHacksCheck1674567890160 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, verify no existing data violates constraint
    await queryRunner.query(`
      SELECT attacker_id, COUNT(*) as count
      FROM hack_operations
      WHERE status = 'in_progress'
      GROUP BY attacker_id
      HAVING COUNT(*) > 3
    `);
    // If above returns rows, clean data first

    // Add constraint
    await queryRunner.query(`
      ALTER TABLE "hack_operations"
      ADD CONSTRAINT "max_concurrent_hacks"
      CHECK (
        (SELECT COUNT(*) FROM hack_operations ho2 
         WHERE ho2.attacker_id = hack_operations.attacker_id 
           AND ho2.status = 'in_progress') <= 3
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "hack_operations"
      DROP CONSTRAINT "max_concurrent_hacks"
    `);
  }
}
```

**Note:** This constraint is complex and may impact performance. Better enforced at application level.

---

### 5. Data Migrations

**Example:** Populate default unlocks for existing players

```typescript
export class GrantStarterUnlocksToExistingPlayers1674567890170 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO progression_unlocks (player_id, unlock_type, unlock_key)
      SELECT 
        p.id,
        'tool'::unlock_type,
        unlock_key
      FROM players p
      CROSS JOIN (
        VALUES ('basic_scanner'), ('weak_exploit')
      ) AS starter_unlocks(unlock_key)
      ON CONFLICT (player_id, unlock_key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM progression_unlocks
      WHERE unlock_key IN ('basic_scanner', 'weak_exploit')
    `);
  }
}
```

**Safe:** `ON CONFLICT DO NOTHING` makes it idempotent

**Rollback:** Only delete data added by migration

---

### 6. Renaming Columns/Tables

**Example:** Rename column for clarity

```typescript
export class RenamePlayerEnergyToCurrentEnergy1674567890180 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" 
      RENAME COLUMN "energy" TO "current_energy"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" 
      RENAME COLUMN "current_energy" TO "energy"
    `);
  }
}
```

**Danger:** Application code must be updated simultaneously

**Strategy:** Deploy in two phases:

1. Add new column, copy data, deprecate old column
2. Wait for app deployment to use new column
3. Drop old column in separate migration

---

### 7. Dropping Columns (Safe Pattern)

**Phase 1:** Deprecate column

```typescript
export class DeprecatePlayerOldColumn1674567890190 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Just add comment, don't drop yet
    await queryRunner.query(`
      COMMENT ON COLUMN "players"."old_column" IS 'DEPRECATED: Will be removed in migration 1674567890200'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op
  }
}
```

**Phase 2:** Drop column after deprecation period

```typescript
export class DropPlayerOldColumn1674567890200 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "players" DROP COLUMN "old_column"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate column if needed (data lost)
    await queryRunner.query(`
      ALTER TABLE "players" ADD COLUMN "old_column" VARCHAR(50)
    `);
  }
}
```

---

## Migration Execution

### Development

```bash
# Generate migration from entity changes
npm run typeorm migration:generate -- -n AddNewColumn

# Create empty migration
npm run typeorm migration:create -- -n CustomMigration

# Run pending migrations
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert

# Show migration status
npm run typeorm migration:show
```

### Staging

```bash
# Before deployment
npm run typeorm migration:run -- --config staging

# Verify schema matches entities
npm run typeorm schema:log -- --config staging
```

### Production

```bash
# Automated via CI/CD pipeline
# Run as part of deployment script

# Example deployment script:
npm run typeorm migration:run -- --config production

# If migration fails, deployment aborts
# Previous version continues running
```

---

## Safety Rules

### 1. Always Provide Rollback

✅ **Every migration must have functional `down()` method**

```typescript
// Bad: No rollback
public async down(queryRunner: QueryRunner): Promise<void> {
  // TODO: implement
}

// Good: Proper rollback
public async down(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP INDEX "idx_players_level"`);
}
```

### 2. Backward-Compatible Changes

✅ **Preferred changes:**

- Add nullable column: `ADD COLUMN ... NULL`
- Add column with default: `ADD COLUMN ... DEFAULT ...`
- Create index: `CREATE INDEX CONCURRENTLY`
- Add constraint (after validating data)

❌ **Avoid (requires coordinated deployment):**

- Rename column (breaks old code)
- Change column type (breaks old code)
- Drop column (breaks old code)
- Add NOT NULL without default

### 3. Test Migrations

✅ **Before merging:**

- Run migration on local dev database
- Verify schema matches expected state
- Test rollback (`migration:revert`)
- Re-run migration (test idempotency)

✅ **On staging:**

- Run migration on staging database
- Deploy new code
- Run integration tests
- Test rollback procedure

### 4. Idempotent Migrations

✅ **Migrations should be safe to run multiple times**

```typescript
// Good: Idempotent
await queryRunner.query(`
  CREATE TABLE IF NOT EXISTS "users" (...)
`);

// Good: Idempotent
await queryRunner.query(`
  INSERT INTO progression_unlocks (...)
  ON CONFLICT (player_id, unlock_key) DO NOTHING
`);

// Bad: Not idempotent
await queryRunner.query(`
  CREATE TABLE "users" (...)  -- Fails if already exists
`);
```

### 5. One Logical Change Per Migration

✅ **Good:**

- `CreateUsersTable.ts` — only creates users table
- `AddEnergyMaxColumn.ts` — only adds energy_max

❌ **Bad:**

- `UpdateDatabase.ts` — creates table, adds columns, modifies data

**Rationale:** Easier to rollback granular changes

---

## Migration Order (Initial Schema)

```
1. CreateEnumTypes.ts           -- Create ENUM types first
2. CreateUsersTable.ts          -- No dependencies
3. CreatePlayersTable.ts        -- Depends on users
4. CreateComputersTable.ts      -- Depends on players
5. CreateDefensesTable.ts       -- Depends on computers
6. CreateHackOperationsTable.ts -- Depends on players, computers
7. CreateProgressionUnlocksTable.ts -- Depends on players
8. CreateIndexes.ts             -- All indexes after tables
```

**Reason:** Foreign keys require referenced tables to exist first

---

## Rollback Strategy

### Automatic Rollback

TypeORM migrations are transactional by default (except `CONCURRENTLY` indexes).

**If migration fails:**

- Transaction is rolled back automatically
- Database remains in previous state
- Deployment fails, old version continues running

### Manual Rollback

**If migration succeeds but breaks application:**

```bash
# Revert last migration
npm run typeorm migration:revert -- --config production

# Revert multiple migrations
npm run typeorm migration:revert -- --config production
npm run typeorm migration:revert -- --config production
```

**Deployment rollback:**

1. Stop new application version
2. Revert migrations (`migration:revert`)
3. Redeploy previous application version
4. Verify system health

---

## Versioning & Tracking

### Migration History Table

TypeORM automatically creates `migrations` table:

```sql
CREATE TABLE "migrations" (
  "id" SERIAL PRIMARY KEY,
  "timestamp" BIGINT NOT NULL,
  "name" VARCHAR(255) NOT NULL
);
```

**Tracks:**

- Which migrations have been executed
- Order of execution
- Prevents re-running migrations

### Git Workflow

```
feature/add-energy-regen
  ├── src/entities/Player.ts (updated)
  ├── migrations/1674567890140-AddEnergyRegenToPlayers.ts (new)
  └── tests/migrations/add-energy-regen.spec.ts (new)
```

**Process:**

1. Update entity class
2. Generate migration: `npm run typeorm migration:generate`
3. Review generated SQL
4. Add manual edits if needed (indexes, constraints)
5. Write migration test
6. Commit migration file with code changes

---

## Testing Migrations

### Unit Tests

```typescript
describe("AddEnergyRegenToPlayers Migration", () => {
  it("should add last_energy_regen_at column", async () => {
    // Run migration
    await migration.up(queryRunner);

    // Verify column exists
    const columns = await queryRunner.getTable("players");
    const column = columns.columns.find(
      (c) => c.name === "last_energy_regen_at",
    );

    expect(column).toBeDefined();
    expect(column.type).toBe("timestamptz");
  });

  it("should rollback cleanly", async () => {
    await migration.up(queryRunner);
    await migration.down(queryRunner);

    const columns = await queryRunner.getTable("players");
    const column = columns.columns.find(
      (c) => c.name === "last_energy_regen_at",
    );

    expect(column).toBeUndefined();
  });
});
```

### Integration Tests

```typescript
describe("Migration Flow", () => {
  it("should migrate from v1 to v2 without data loss", async () => {
    // Insert test data in v1 schema
    await insertTestPlayers();

    // Run migration
    await runMigrations();

    // Verify data integrity
    const players = await playerRepo.find();
    expect(players).toHaveLength(10);
    expect(players[0].lastEnergyRegenAt).toBeDefined();
  });
});
```

---

## Production Checklist

Before running migration in production:

- [ ] Migration tested in local dev environment
- [ ] Migration tested in staging environment
- [ ] Rollback tested and documented
- [ ] Migration is idempotent (safe to retry)
- [ ] Backward-compatible with current app version (if possible)
- [ ] Estimated execution time measured (< 1 minute ideal)
- [ ] Database backup taken before migration
- [ ] Monitoring dashboard ready (query performance, error rates)
- [ ] Team notified of deployment window
- [ ] Rollback plan documented and rehearsed

---

## Common Patterns

### Add Column with Data Population

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // 1. Add column (nullable)
  await queryRunner.query(`
    ALTER TABLE "players" ADD COLUMN "total_hacks" INTEGER
  `);

  // 2. Populate data
  await queryRunner.query(`
    UPDATE "players" p
    SET "total_hacks" = (
      SELECT COUNT(*) FROM "hack_operations" ho
      WHERE ho.attacker_id = p.id
    )
  `);

  // 3. Add NOT NULL constraint
  await queryRunner.query(`
    ALTER TABLE "players" ALTER COLUMN "total_hacks" SET NOT NULL
  `);

  // 4. Add default for future rows
  await queryRunner.query(`
    ALTER TABLE "players" ALTER COLUMN "total_hacks" SET DEFAULT 0
  `);
}
```

### Split Table (Normalization)

```typescript
// Before: players table has skill_stealth, skill_cracking, etc.
// After: separate player_skills table

public async up(queryRunner: QueryRunner): Promise<void> {
  // 1. Create new table
  await queryRunner.query(`CREATE TABLE "player_skills" (...)`);

  // 2. Migrate data
  await queryRunner.query(`
    INSERT INTO "player_skills" (player_id, skill_type, skill_level)
    SELECT id, 'stealth', skill_stealth FROM players
    UNION ALL
    SELECT id, 'cracking', skill_cracking FROM players
  `);

  // 3. Drop old columns (in separate migration after deprecation)
}
```

---

## Summary

✅ **Migration tool:** TypeORM CLI  
✅ **Versioning:** Timestamp-based, Git-tracked  
✅ **Safety:** Transactional, rollbackable, tested  
✅ **Strategy:** Backward-compatible, idempotent, granular  
✅ **Process:** Dev → Staging → Production with validation

**Status:** Ready for initial schema implementation.
