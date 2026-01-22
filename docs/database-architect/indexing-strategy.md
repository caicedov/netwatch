# Indexing Strategy

## Overview

This document defines the indexing strategy for NetWatch PostgreSQL database, based on actual access patterns and query requirements. Indexes are critical for real-time performance (<200ms latency) at target concurrency (100-500 players).

**Design Principles:**

- Index all foreign keys (for JOIN performance)
- Use partial indexes for filtered queries
- Create composite indexes for multi-column WHERE clauses
- Use GIN indexes for JSONB queries
- Monitor and adjust based on actual query patterns

---

## Access Patterns (Critical Queries)

### 1. Authentication & Session

**Query:** User login

```sql
SELECT id, password_hash, is_active
FROM users
WHERE username = :username;
```

**Index:**

```sql
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

**Already created:** Via `UNIQUE` constraint

**Access frequency:** Every login (medium frequency)  
**Expected performance:** < 5ms (unique index lookup)

---

### 2. Load Player State

**Query:** Get player by user ID

```sql
SELECT * FROM players WHERE user_id = :user_id;
```

**Index:**

```sql
CREATE UNIQUE INDEX idx_players_user ON players(user_id);
```

**Already created:** Via `UNIQUE` constraint (enforces 1:1)

**Access frequency:** Every WebSocket connection (high frequency)  
**Expected performance:** < 5ms (unique index lookup)

---

### 3. List Player's Computers

**Query:** Get all computers owned by player

```sql
SELECT * FROM computers
WHERE owner_id = :player_id;
```

**Index:**

```sql
CREATE INDEX idx_computers_owner ON computers(owner_id);
```

**Access frequency:** On player login, computer list view (high)  
**Expected performance:** < 10ms (index scan, typically 1-10 rows)

---

### 4. Find Target by IP

**Query:** Lookup computer for hacking target

```sql
SELECT id, owner_id, is_online, firewall_level
FROM computers
WHERE ip_address = :ip;
```

**Index:**

```sql
CREATE UNIQUE INDEX idx_computers_ip ON computers(ip_address);
```

**Already created:** Via `UNIQUE` constraint

**Access frequency:** Every hack initiation (medium)  
**Expected performance:** < 5ms (unique index lookup)

---

### 5. Find Online Computers (Target Selection)

**Query:** List hackable targets

```sql
SELECT id, owner_id, ip_address
FROM computers
WHERE is_online = true
ORDER BY RANDOM()
LIMIT 20;
```

**Index:**

```sql
CREATE INDEX idx_computers_online ON computers(is_online)
WHERE is_online = true;
```

**Type:** Partial index (only indexes online computers)

**Access frequency:** Target selection UI (medium)  
**Expected performance:** < 20ms (partial index scan + random sample)

**Trade-off:** Partial index smaller than full index, faster updates

---

### 6. Active Hacks by Player

**Query:** Get all in-progress hacks initiated by player

```sql
SELECT * FROM hack_operations
WHERE attacker_id = :player_id
  AND status = 'in_progress';
```

**Index:**

```sql
CREATE INDEX idx_hack_attacker_status ON hack_operations(attacker_id, status);
```

**Type:** Composite index (both columns in WHERE clause)

**Access frequency:** Dashboard view, action validation (high)  
**Expected performance:** < 10ms (composite index scan)

**Alternative:** Separate indexes on `attacker_id` and `status`, but composite is more efficient for this query pattern.

---

### 7. Hacks Against Player's Computers

**Query:** Get all attacks targeting player's systems

```sql
SELECT ho.* FROM hack_operations ho
JOIN computers c ON ho.target_computer_id = c.id
WHERE c.owner_id = :player_id
  AND ho.status IN ('pending', 'in_progress');
```

**Indexes:**

```sql
-- Already created
CREATE INDEX idx_hack_target ON hack_operations(target_computer_id);
CREATE INDEX idx_computers_owner ON computers(owner_id);
```

**Access frequency:** Defense dashboard, notifications (medium)  
**Expected performance:** < 20ms (two index scans + hash join)

---

### 8. Process Completed Hacks (Background Worker)

**Query:** Find hacks ready for completion

```sql
SELECT * FROM hack_operations
WHERE status = 'in_progress'
  AND completion_at <= NOW()
ORDER BY completion_at ASC
LIMIT 100;
```

**Index:**

```sql
CREATE INDEX idx_hack_pending ON hack_operations(completion_at)
WHERE status = 'in_progress';
```

**Type:** Partial index (only pending operations)

**Access frequency:** Background worker every 5-10 seconds (high)  
**Expected performance:** < 10ms (partial index range scan)

**Trade-off:** Partial index dramatically reduces size (only ~1-5% of rows)

---

### 9. Get Computer's Defenses

**Query:** Load all defenses for defense effectiveness calculation

```sql
SELECT defense_type, level FROM defenses
WHERE computer_id = :computer_id;
```

**Index:**

```sql
CREATE INDEX idx_defenses_computer ON defenses(computer_id);
```

**Access frequency:** Every hack attempt (high)  
**Expected performance:** < 5ms (index scan, typically 0-4 rows)

---

### 10. Check Defense Existence

**Query:** Verify if defense already installed before purchase

```sql
SELECT id FROM defenses
WHERE computer_id = :computer_id
  AND defense_type = :type;
```

**Index:**

```sql
CREATE UNIQUE INDEX idx_defenses_unique ON defenses(computer_id, defense_type);
```

**Already created:** Via `UNIQUE` constraint

**Access frequency:** Defense installation (low)  
**Expected performance:** < 5ms (unique index lookup)

---

### 11. Check Player Unlocks

**Query:** Verify if player has access to tool/upgrade

```sql
SELECT EXISTS(
  SELECT 1 FROM progression_unlocks
  WHERE player_id = :player_id
    AND unlock_key = :key
);
```

**Index:**

```sql
CREATE UNIQUE INDEX idx_unlocks_player_key ON progression_unlocks(player_id, unlock_key);
```

**Already created:** Via `UNIQUE` constraint

**Access frequency:** Action validation (high)  
**Expected performance:** < 5ms (unique index lookup)

---

### 12. Find Hacks Using Specific Tool (Analytics)

**Query:** Query JSONB array for tool usage

```sql
SELECT * FROM hack_operations
WHERE tools_used @> '["exploit_kit"]'::jsonb;
```

**Index:**

```sql
CREATE INDEX idx_hack_tools ON hack_operations USING GIN (tools_used);
```

**Type:** GIN index (optimized for JSONB containment queries)

**Access frequency:** Analytics, debugging (low)  
**Expected performance:** < 50ms (GIN index scan)

**Trade-off:** GIN indexes are large and slower to update, but essential for JSONB queries

---

## Index Inventory

### Primary Key Indexes (Automatic)

```sql
-- Created automatically by PRIMARY KEY constraint
users.id
players.id
computers.id
defenses.id
hack_operations.id
progression_unlocks.id
```

**Type:** B-tree  
**Purpose:** Unique lookups by ID

---

### Unique Constraint Indexes (Automatic)

```sql
-- Created automatically by UNIQUE constraint
users.username
users.email (partial: WHERE email IS NOT NULL)
players.user_id
computers.ip_address
defenses(computer_id, defense_type) -- composite
progression_unlocks(player_id, unlock_key) -- composite
```

**Type:** B-tree  
**Purpose:** Enforce uniqueness + fast lookups

---

### Foreign Key Indexes (Explicit)

```sql
-- Must be created manually (PostgreSQL doesn't auto-index FKs)
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_computers_owner ON computers(owner_id);
CREATE INDEX idx_defenses_computer ON defenses(computer_id);
CREATE INDEX idx_hack_attacker ON hack_operations(attacker_id);
CREATE INDEX idx_hack_target ON hack_operations(target_computer_id);
CREATE INDEX idx_unlocks_player ON progression_unlocks(player_id);
```

**Type:** B-tree  
**Purpose:** JOIN performance, foreign key lookups

**Critical:** Always index foreign keys to avoid full table scans during JOINs

---

### Partial Indexes (Conditional)

```sql
-- Only indexes online computers
CREATE INDEX idx_computers_online ON computers(is_online)
WHERE is_online = true;

-- Only indexes pending hacks (for worker processing)
CREATE INDEX idx_hack_pending ON hack_operations(completion_at)
WHERE status = 'in_progress';

-- Only indexes non-null emails
CREATE INDEX idx_users_email ON users(email)
WHERE email IS NOT NULL;
```

**Type:** B-tree (partial)  
**Purpose:** Reduce index size, improve performance for filtered queries

**Advantage:** Much smaller than full index (only indexes subset of rows)

---

### Composite Indexes (Multi-Column)

```sql
-- For queries with both attacker_id AND status in WHERE clause
CREATE INDEX idx_hack_attacker_status ON hack_operations(attacker_id, status);
```

**Type:** B-tree (composite)  
**Purpose:** Optimize queries filtering on multiple columns

**Column Order:** Most selective column first (attacker_id narrows down more than status)

---

### JSONB Indexes (GIN)

```sql
-- For containment queries on tools_used
CREATE INDEX idx_hack_tools ON hack_operations USING GIN (tools_used);
```

**Type:** GIN (Generalized Inverted Index)  
**Purpose:** Fast queries on JSONB arrays/objects

**Query Support:**

- Containment: `tools_used @> '["tool_id"]'`
- Existence: `tools_used ? 'tool_id'`

**Trade-off:** Large index, slower writes, but essential for JSONB queries

---

### Timestamp Indexes (Range Queries)

```sql
-- For date range queries, analytics
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_players_created ON players(created_at);
```

**Type:** B-tree  
**Purpose:** Range queries, ordering, analytics

**Usage:** Leaderboards, "players joined this week", etc.

---

## Index Creation Guidelines

### When to Create

✅ **Always index:**

- Primary keys (automatic)
- Foreign keys (manual)
- Unique constraints (automatic)
- Columns in WHERE clauses of frequent queries
- Columns in JOIN conditions

✅ **Consider indexing:**

- Columns in ORDER BY clauses
- Columns in GROUP BY clauses
- JSONB columns with containment queries

❌ **Avoid indexing:**

- Low-cardinality columns (e.g., boolean with 50/50 distribution)
- Columns rarely queried
- Small tables (< 1000 rows)
- Write-heavy columns (indexes slow down writes)

### How to Create

**Standard index:**

```sql
CREATE INDEX idx_table_column ON table_name(column_name);
```

**Partial index:**

```sql
CREATE INDEX idx_table_column ON table_name(column_name)
WHERE condition;
```

**Composite index:**

```sql
CREATE INDEX idx_table_cols ON table_name(col1, col2);
```

**GIN index (JSONB):**

```sql
CREATE INDEX idx_table_json ON table_name USING GIN (json_column);
```

**Concurrent index (production):**

```sql
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);
```

**Note:** `CONCURRENTLY` avoids locking table during index creation (slower, but safe for production).

---

## Index Maintenance

### Monitoring

**Check index usage:**

```sql
SELECT
  schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

**Find unused indexes:**

```sql
SELECT
  schemaname, tablename, indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public';
```

**Check index bloat:**

```sql
SELECT
  schemaname, tablename, indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Rebuilding

**Rebuild bloated index:**

```sql
REINDEX INDEX CONCURRENTLY idx_name;
```

**Rebuild all indexes for table:**

```sql
REINDEX TABLE CONCURRENTLY table_name;
```

**Note:** Use `CONCURRENTLY` to avoid locking (PostgreSQL 12+).

---

## Performance Expectations

### Query Latency Targets

| Query Type              | Target Latency | Index Strategy              |
| ----------------------- | -------------- | --------------------------- |
| Single row by PK/unique | < 5ms          | Unique index                |
| Foreign key lookup      | < 10ms         | Foreign key index           |
| Filtered query          | < 20ms         | Partial/composite index     |
| JSONB containment       | < 50ms         | GIN index                   |
| Complex JOIN (2-3 tabs) | < 30ms         | Indexes on all JOIN columns |
| Range scan (ORDER BY)   | < 50ms         | Index on ORDER BY column    |

### Index Size Estimates (500 active players)

| Table               | Estimated Rows | Total Index Size |
| ------------------- | -------------- | ---------------- |
| users               | 500            | ~100 KB          |
| players             | 500            | ~100 KB          |
| computers           | 1,500          | ~300 KB          |
| defenses            | 3,000          | ~500 KB          |
| hack_operations     | 50,000         | ~10 MB           |
| progression_unlocks | 5,000          | ~1 MB            |

**Total:** ~12 MB (negligible, fits in memory)

### Scaling Considerations

At 10,000 active players:

- Index size: ~250 MB (still manageable)
- Query performance: Should remain similar (B-tree scales logarithmically)
- Consider partitioning `hack_operations` by date if history grows unbounded

---

## Optimization Workflow

1. **Deploy with planned indexes** (this document)
2. **Monitor query performance** (pg_stat_statements, slow query log)
3. **Identify slow queries** (`EXPLAIN ANALYZE`)
4. **Add missing indexes** (based on actual query patterns)
5. **Remove unused indexes** (if `idx_scan = 0` after weeks)
6. **Rebuild bloated indexes** (quarterly maintenance)

---

## Summary

✅ **26 total indexes** (including automatic PK/unique)  
✅ **All foreign keys indexed**  
✅ **Partial indexes for filtered queries**  
✅ **Composite index for common query pattern**  
✅ **GIN index for JSONB queries**  
✅ **Performance target: < 50ms for 95th percentile**

**Status:** Ready for implementation and monitoring.
