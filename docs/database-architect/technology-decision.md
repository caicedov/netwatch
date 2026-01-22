# Technology Decision: Database Layer

## Context

NetWatch requires persistent storage for:

- User authentication and account data
- Player game state (resources, progression)
- Virtual computers and defenses
- Active and historical hack operations
- Progression unlocks

The game operates in real-time with:

- Concurrent player actions
- Server-authoritative state
- Low-to-medium concurrency (100-500 concurrent players)
- Complex relationships between entities
- Strong consistency requirements

## Decision

**Primary Database: PostgreSQL 15+**

PostgreSQL will serve as the single source of truth for all game state.

## Rationale

### 1. ACID Compliance

**Requirement:** Game state must never corrupt from concurrent actions (e.g., two players hacking the same computer simultaneously).

**PostgreSQL provides:**

- Full ACID transactions
- Row-level locking
- Serializable isolation when needed
- Multi-version concurrency control (MVCC)

**Example critical transaction:**

```sql
BEGIN;
  -- Deduct attacker energy
  UPDATE players SET energy = energy - 10
  WHERE id = :attacker_id AND energy >= 10;

  -- Create hack operation
  INSERT INTO hack_operations (...) VALUES (...);

  -- Verify concurrent operation limit
  IF (SELECT COUNT(*) FROM hack_operations
      WHERE attacker_id = :id AND status = 'in_progress') > 3
    THEN ROLLBACK;
COMMIT;
```

### 2. Relational Model Alignment

**Requirement:** Entities have clear relationships with referential integrity constraints.

**Domain relationships:**

- User 1:1 Player (enforced via UNIQUE constraint)
- Player 1:N Computer
- Computer 1:N Defense
- Player N:M HackOperation (via attacker/target foreign keys)

**PostgreSQL advantages:**

- Foreign key constraints prevent orphaned records
- Cascading deletes/updates maintain consistency
- JOIN performance for complex queries (e.g., "show all active hacks against my computers")

### 3. Flexible Schema with JSONB

**Requirement:** Some attributes are semi-structured or will evolve (e.g., hack configuration, tool parameters).

**PostgreSQL JSONB:**

- Store `toolsUsed` array without separate table (MVP simplicity)
- Index JSONB fields with GIN indexes
- Query nested data efficiently
- Maintain strong typing for core fields while allowing flexibility

**Example:**

```sql
CREATE TABLE hack_operations (
  ...
  hack_type VARCHAR(50) NOT NULL,
  tools_used JSONB DEFAULT '[]'::jsonb,
  result_data JSONB NULL, -- success_roll, resources_stolen, etc.
  ...
);

CREATE INDEX idx_hack_tools ON hack_operations USING GIN (tools_used);
```

### 4. Temporal Data Support

**Requirement:** Track when actions start, complete, and handle scheduled events.

**PostgreSQL features:**

- `TIMESTAMPTZ` for timezone-aware timestamps (server time is authoritative)
- Efficient indexes on timestamp columns
- `WHERE completion_at <= NOW()` queries for event processing
- Partial indexes for performance:
  ```sql
  CREATE INDEX idx_pending_hacks ON hack_operations (completion_at)
  WHERE status = 'in_progress'
  ```

### 5. Enumeration Support

**Requirement:** Status transitions, hack types, defense types must be constrained.

**PostgreSQL enums vs. constraints:**

```sql
CREATE TYPE hack_status AS ENUM ('pending', 'in_progress', 'succeeded', 'failed', 'aborted');
CREATE TYPE hack_type AS ENUM ('steal_money', 'steal_data', 'install_virus', 'ddos');
CREATE TYPE defense_type AS ENUM ('firewall', 'antivirus', 'honeypot', 'ids');
```

**Advantages:**

- Type safety at DB level
- Automatic validation
- Clear schema documentation
- Performance (stored as integers internally)

### 6. Concurrent Update Safety

**Requirement:** Multiple operations may modify player resources simultaneously.

**PostgreSQL mechanisms:**

- `SELECT FOR UPDATE` locks rows for modification
- `UPDATE ... WHERE condition` atomic test-and-set
- Optimistic locking with version columns if needed

**Example:**

```sql
-- Atomic energy consumption (fails if insufficient)
UPDATE players
SET energy = energy - :cost
WHERE id = :player_id AND energy >= :cost
RETURNING energy;
```

### 7. Query Performance at Target Scale

**Requirement:** Support 100-500 concurrent players with sub-200ms query latency.

**PostgreSQL characteristics:**

- Well-optimized for reads and writes at this scale
- Connection pooling (PgBouncer) handles 500+ connections
- Query planner handles complex JOINs efficiently
- Materialized views if needed for leaderboards/stats

**Estimated load:**

- 500 players × 1 action/min ≈ 8 queries/sec (well within PostgreSQL capacity)
- Hack completions: background worker processing queue
- Real-time updates: read current state, broadcast via WebSocket

### 8. Developer Experience

**Solo developer constraint:** Minimize operational complexity.

**PostgreSQL benefits:**

- Mature ecosystem and tooling
- TypeORM integration (TypeScript end-to-end)
- Excellent documentation
- `psql` CLI for debugging
- PgAdmin for visual inspection
- Managed services (AWS RDS, Render, Supabase) for production

### 9. Data Integrity & Constraints

**Requirement:** Prevent invalid state at the database level.

**PostgreSQL constraints:**

```sql
-- Energy cannot be negative
CHECK (energy >= 0)

-- Money cannot be negative
CHECK (money >= 0)

-- Completion time must be in future on creation
CHECK (completion_at > started_at)

-- One defense type per computer
UNIQUE (computer_id, defense_type)
```

### 10. Migration & Evolution

**Requirement:** Schema must evolve without breaking production data.

**PostgreSQL strengths:**

- `ALTER TABLE` supports most operations online
- Transactional DDL (schema changes in transactions)
- Migration tools: TypeORM migrations, Flyway, Liquibase
- Backward-compatible changes: `ADD COLUMN ... DEFAULT ...`

## Alternatives Considered

### MongoDB (NoSQL Document Store)

**Rejected because:**

- Lack of ACID transactions across collections (critical for resource transfers)
- No foreign key constraints (referential integrity must be application-managed)
- JOIN performance inferior for relational data
- Game entities are highly relational, not document-oriented

**When it would be suitable:**

- Event logs, analytics
- Highly nested documents with infrequent relationships
- Eventual consistency acceptable

### Redis (In-Memory)

**Not rejected, but limited role:**

- **Use case:** Session state, active operation cache, real-time leaderboards
- **Not suitable for:** Persistent game state (durability required)
- **Decision:** Use Redis as accelerator, not primary store

### MySQL/MariaDB

**Rejected because:**

- Weaker JSON support (no JSONB equivalent)
- Less powerful constraint enforcement
- PostgreSQL's MVCC model better for concurrent reads/writes
- PostgreSQL ecosystem more aligned with modern Node.js tools

**Would be acceptable alternative if:**

- Team had existing MySQL expertise
- Hosting environment favored MySQL

## Redis Integration (Complementary)

**Not replacing PostgreSQL, but augmenting:**

### Use Cases

1. **WebSocket Session Mapping**
   - `userId → connectionId` for real-time notifications
   - Ephemeral data (cleared on disconnect)

2. **Active Operation Cache**
   - Cache `HackOperation` in progress for fast lookups
   - `HSET hack:{operationId} ...`
   - TTL = estimated duration + buffer
   - Source of truth remains PostgreSQL

3. **Energy Regeneration State**
   - Track last regeneration timestamp per player
   - Avoid DB writes every second
   - Periodic sync to PostgreSQL

4. **Rate Limiting**
   - Prevent action spam (e.g., "max 10 hacks/minute")
   - `INCR player:{id}:hack_count` with TTL

### Synchronization Strategy

- **Write-through:** Update PostgreSQL, then update Redis cache
- **Cache invalidation:** On state change, delete Redis key
- **Recovery:** Redis data loss acceptable (rebuild from PostgreSQL)

## Non-Goals (Explicit Exclusions)

The database design will **NOT**:

1. **Shard or distribute** (single PostgreSQL instance sufficient for MVP)
2. **Implement event sourcing** (state-based, not event log)
3. **Use multi-region replication** (single region deployment)
4. **Optimize for analytics** (OLTP workload, not OLAP)
5. **Support multi-tenancy** (single game instance)

If any of these become necessary, they require re-evaluation and new ADR.

## Risks & Mitigations

### Risk: Connection Pool Exhaustion

**Scenario:** 500 concurrent players × long-running transactions = connection starvation

**Mitigation:**

- Use PgBouncer for connection pooling (transaction mode)
- Limit max pool size per application instance
- Monitor connection usage metrics
- Keep transactions short (acquire lock → apply change → commit)

### Risk: Slow Query Performance

**Scenario:** Complex JOINs or missing indexes cause slow queries

**Mitigation:**

- Index all foreign keys
- Partial indexes for filtered queries (`WHERE status = 'in_progress'`)
- `EXPLAIN ANALYZE` all critical queries during development
- Query performance monitoring (pg_stat_statements)

### Risk: Schema Migration Downtime

**Scenario:** ALTER TABLE locks table, blocking operations

**Mitigation:**

- Use online schema change tools (pg_repack if needed)
- Add columns with defaults (non-blocking)
- Create indexes CONCURRENTLY
- Schedule migrations during low-traffic windows (MVP acceptable)

### Risk: Data Loss

**Scenario:** Hardware failure or corruption

**Mitigation:**

- Automated backups (daily full + WAL archiving)
- Point-in-time recovery capability
- Managed service handles this (RDS, Render)
- Test restore procedure regularly

## Decision Summary

| Aspect            | Choice             | Primary Reason                        |
| ----------------- | ------------------ | ------------------------------------- |
| Primary Database  | PostgreSQL 15+     | ACID, relational model, JSONB         |
| Cache Layer       | Redis (optional)   | Session state, active operation cache |
| ORM/Query Builder | TypeORM            | TypeScript integration, migrations    |
| Connection Pool   | PgBouncer          | Handle concurrent connections         |
| Hosting (MVP)     | Managed PostgreSQL | Reduce operational burden             |
| Schema Evolution  | TypeORM Migrations | Version-controlled, transactional DDL |

## Approval Criteria

This decision is validated if:

- ✅ All domain aggregates can be persisted with referential integrity
- ✅ Concurrent resource updates do not cause race conditions
- ✅ Query latency < 50ms for 95th percentile at target scale
- ✅ Schema migrations can be applied without data loss
- ✅ Single developer can operate and debug the database

**Status:** Approved for MVP implementation.
