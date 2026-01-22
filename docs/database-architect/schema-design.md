# Database Schema Design

## Overview

This document defines the PostgreSQL schema for NetWatch, aligned with the domain model and real-time constraints. The schema enforces invariants at the database level and supports server-authoritative gameplay.

**Design Principles:**

- Normalize first (≈3NF), denormalize only when measured
- Enforce constraints at DB level when possible
- Use JSONB for semi-structured data, not core entities
- Timestamps always with timezone (TIMESTAMPTZ)
- UUIDs for primary keys (security, distribution)

---

## Core Tables

### 1. users

**Purpose:** Stores authentication and account data for human players.

**Aggregate Root:** User

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        VARCHAR(20) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NULL,
  is_active       BOOLEAN DEFAULT true NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at   TIMESTAMPTZ NULL,

  CONSTRAINT username_length CHECK (char_length(username) BETWEEN 3 AND 20)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_created ON users(created_at);
```

**Columns:**

- `id`: Primary key, UUID v4 for security
- `username`: Unique login identifier, immutable after creation
- `password_hash`: Bcrypt hash (application handles hashing)
- `email`: Optional, unique if provided (for recovery)
- `is_active`: Account status (soft delete, suspension)
- `created_at`: Registration timestamp
- `last_login_at`: Updated on each successful login

**Invariants:**

- Username must be unique and 3-20 characters
- Email must be unique if provided
- Passwords never stored in plaintext

**Ownership:** Identity & Access Context

---

### 2. players

**Purpose:** Stores game character data, resources, and progression.

**Aggregate Root:** Player

```sql
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name    VARCHAR(50) NOT NULL,
  energy          INTEGER DEFAULT 100 NOT NULL CHECK (energy >= 0),
  energy_max      INTEGER DEFAULT 100 NOT NULL CHECK (energy_max >= energy),
  money           BIGINT DEFAULT 0 NOT NULL CHECK (money >= 0),
  experience      BIGINT DEFAULT 0 NOT NULL CHECK (experience >= 0),
  level           INTEGER GENERATED ALWAYS AS (floor(sqrt(experience/100.0))::int) STORED,
  skill_points    INTEGER DEFAULT 0 NOT NULL CHECK (skill_points >= 0),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT player_energy_capacity CHECK (energy <= energy_max)
);

-- Indexes
CREATE UNIQUE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_level ON players(level);
CREATE INDEX idx_players_created ON players(created_at);
```

**Columns:**

- `id`: Primary key
- `user_id`: Foreign key to users (1:1 relationship, enforced by UNIQUE)
- `display_name`: In-game name (can differ from username)
- `energy`: Current action resource (regenerates over time)
- `energy_max`: Maximum energy capacity (increases with level/upgrades)
- `money`: In-game currency (earned from successful hacks)
- `experience`: Total XP earned
- `level`: **Computed column** from experience (formula: `floor(sqrt(experience/100))`)
- `skill_points`: Unspent points for upgrades
- `created_at`: Character creation timestamp

**Invariants:**

- Each user has exactly one player (1:1 via UNIQUE constraint)
- Energy cannot be negative or exceed max
- Money and experience cannot be negative
- Level is read-only (automatically computed)

**Ownership:** Game Core Context

**Cascade Behavior:** Deleting a user deletes their player (and all owned entities)

---

### 3. computers

**Purpose:** Virtual systems owned by players, can be hacked or defended.

**Owned by:** Player (1:N relationship)

```sql
CREATE TABLE computers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name            VARCHAR(50) NOT NULL,
  ip_address      VARCHAR(15) UNIQUE NOT NULL,
  storage         INTEGER DEFAULT 1000 NOT NULL CHECK (storage >= 0),
  cpu             INTEGER DEFAULT 100 NOT NULL CHECK (cpu >= 0),
  memory          INTEGER DEFAULT 512 NOT NULL CHECK (memory >= 0),
  is_online       BOOLEAN DEFAULT true NOT NULL,
  firewall_level  INTEGER DEFAULT 0 NOT NULL CHECK (firewall_level BETWEEN 0 AND 100),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_computers_owner ON computers(owner_id);
CREATE UNIQUE INDEX idx_computers_ip ON computers(ip_address);
CREATE INDEX idx_computers_online ON computers(is_online) WHERE is_online = true;
```

**Columns:**

- `id`: Primary key
- `owner_id`: Foreign key to players
- `name`: Player-assigned name (e.g., "MainServer", "BackupNode")
- `ip_address`: Virtual IP for targeting (generated, must be unique)
- `storage`, `cpu`, `memory`: Virtual hardware resources (abstract units)
- `is_online`: Whether computer is active (offline = immune to hacks)
- `firewall_level`: Base defense strength (0-100, increases with upgrades)
- `created_at`: Creation timestamp

**Invariants:**

- Each player must have at least one computer (enforced at application level)
- IP address must be globally unique
- Firewall level bounded by 0-100

**Ownership:** Game Core Context

**Access Patterns:**

- List player's computers: `WHERE owner_id = ?`
- Find target by IP: `WHERE ip_address = ?`
- Find online targets: `WHERE is_online = true`

---

### 4. defenses

**Purpose:** Installed security software on computers.

**Owned by:** Computer (1:N relationship)

```sql
CREATE TYPE defense_type AS ENUM ('firewall', 'antivirus', 'honeypot', 'ids');

CREATE TABLE defenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id     UUID NOT NULL REFERENCES computers(id) ON DELETE CASCADE,
  defense_type    defense_type NOT NULL,
  level           INTEGER DEFAULT 1 NOT NULL CHECK (level BETWEEN 1 AND 5),
  installed_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_defense_per_computer UNIQUE (computer_id, defense_type)
);

-- Indexes
CREATE INDEX idx_defenses_computer ON defenses(computer_id);
```

**Columns:**

- `id`: Primary key
- `computer_id`: Foreign key to computers
- `defense_type`: Enum type (firewall, antivirus, honeypot, ids)
- `level`: Upgrade tier (1-5)
- `installed_at`: Installation timestamp

**Invariants:**

- Each computer can have at most **one** of each defense type (UNIQUE constraint)
- Level must be between 1 and 5

**Ownership:** Game Core Context (Computer Aggregate)

**Access Patterns:**

- Get all defenses for a computer: `WHERE computer_id = ?`
- Check if defense exists: `WHERE computer_id = ? AND defense_type = ?`

---

### 5. hack_operations

**Purpose:** Represents ongoing or completed hacking attempts.

**Aggregate Root:** HackOperation

```sql
CREATE TYPE hack_status AS ENUM ('pending', 'in_progress', 'succeeded', 'failed', 'aborted');
CREATE TYPE hack_type AS ENUM ('steal_money', 'steal_data', 'install_virus', 'ddos');

CREATE TABLE hack_operations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  target_computer_id  UUID NOT NULL REFERENCES computers(id) ON DELETE CASCADE,
  status              hack_status DEFAULT 'pending' NOT NULL,
  hack_type           hack_type NOT NULL,
  tools_used          JSONB DEFAULT '[]'::jsonb NOT NULL,
  estimated_duration  INTEGER NOT NULL CHECK (estimated_duration > 0),
  started_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completion_at       TIMESTAMPTZ NOT NULL,
  result_data         JSONB NULL,

  CONSTRAINT completion_after_start CHECK (completion_at > started_at)
);

-- Indexes
CREATE INDEX idx_hack_attacker ON hack_operations(attacker_id);
CREATE INDEX idx_hack_target ON hack_operations(target_computer_id);
CREATE INDEX idx_hack_status ON hack_operations(status);
CREATE INDEX idx_hack_pending ON hack_operations(completion_at)
  WHERE status = 'in_progress';
CREATE INDEX idx_hack_tools ON hack_operations USING GIN (tools_used);
```

**Columns:**

- `id`: Primary key
- `attacker_id`: Foreign key to players (who initiated the hack)
- `target_computer_id`: Foreign key to computers (target system)
- `status`: Current state (pending → in_progress → succeeded/failed/aborted)
- `hack_type`: Type of attack (steal_money, steal_data, etc.)
- `tools_used`: JSONB array of tool identifiers (e.g., `["port_scanner", "exploit_kit"]`)
- `estimated_duration`: Seconds to complete (based on difficulty)
- `started_at`: Initiation timestamp
- `completion_at`: Scheduled completion time
- `result_data`: JSONB object with result details (populated on completion):
  ```json
  {
    "successRoll": 75,
    "resourcesStolen": 1000,
    "detectedByTarget": false
  }
  ```

**Invariants:**

- Attacker cannot hack their own computers (enforced at application level or via trigger)
- Status transitions are unidirectional (state machine)
- Completion time must be after start time

**Ownership:** Game Core Context

**Access Patterns:**

- Active hacks by player: `WHERE attacker_id = ? AND status = 'in_progress'`
- Hacks against player's computers: `WHERE target_computer_id IN (...)`
- Process completed hacks: `WHERE status = 'in_progress' AND completion_at <= NOW()`

**JSONB Structure:**

`tools_used` example:

```json
["port_scanner", "exploit_kit", "stealth_module"]
```

`result_data` example:

```json
{
  "successRoll": 75,
  "resourcesStolen": 1000,
  "detectedByTarget": false,
  "xpGranted": 50
}
```

---

### 6. progression_unlocks

**Purpose:** Tracks features/tools/upgrades available to a player.

**Owned by:** Player (1:N relationship)

```sql
CREATE TYPE unlock_type AS ENUM ('tool', 'defense', 'upgrade', 'skill');

CREATE TABLE progression_unlocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  unlock_type     unlock_type NOT NULL,
  unlock_key      VARCHAR(50) NOT NULL,
  unlocked_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_player_unlock UNIQUE (player_id, unlock_key)
);

-- Indexes
CREATE INDEX idx_unlocks_player ON progression_unlocks(player_id);
CREATE INDEX idx_unlocks_key ON progression_unlocks(unlock_key);
```

**Columns:**

- `id`: Primary key
- `player_id`: Foreign key to players
- `unlock_type`: Category (tool, defense, upgrade, skill)
- `unlock_key`: Unique identifier (e.g., `"port_scanner"`, `"firewall_tier_2"`)
- `unlocked_at`: Timestamp of unlock

**Invariants:**

- Each player can unlock a given key only once (UNIQUE constraint)
- Unlocks are permanent (no revocation in MVP)

**Ownership:** Progression Context (Player Aggregate)

**Access Patterns:**

- Check if player has unlock: `WHERE player_id = ? AND unlock_key = ?`
- List all unlocks: `WHERE player_id = ?`

---

## Entity Relationships (ERD)

```
┌─────────────┐
│    users    │
│ (1:1)       │
└──────┬──────┘
       │
       │ user_id (UNIQUE FK)
       │
       ▼
┌─────────────┐
│   players   │◄────────────┐
│ (1:N)       │             │
└──────┬──────┘             │
       │                    │ attacker_id (FK)
       │ owner_id (FK)      │
       │                    │
       ▼              ┌─────┴──────────────┐
┌─────────────┐      │  hack_operations   │
│  computers  │◄─────┤                    │
│ (1:N)       │      │ target_computer_id │
└──────┬──────┘      └────────────────────┘
       │
       │ computer_id (FK)
       │
       ▼
┌─────────────┐
│  defenses   │
└─────────────┘

┌─────────────┐
│   players   │
│ (1:N)       │
└──────┬──────┘
       │ player_id (FK)
       │
       ▼
┌───────────────────────┐
│ progression_unlocks   │
└───────────────────────┘
```

**Key Relationships:**

- `users` 1:1 `players` (via `players.user_id UNIQUE`)
- `players` 1:N `computers` (via `computers.owner_id`)
- `computers` 1:N `defenses` (via `defenses.computer_id`)
- `players` 1:N `progression_unlocks` (via `progression_unlocks.player_id`)
- `players` N:M `hack_operations` (via `attacker_id` and `target_computer_id`)

---

## Normalization & Denormalization

### Normalized (3NF)

All tables are normalized to avoid:

- Update anomalies
- Deletion anomalies
- Insertion anomalies

**Example:** Defense effectiveness is calculated dynamically (not stored), based on `defense_type` and `level`.

### Controlled Denormalization

**1. Computed Columns:**

- `players.level` is computed from `experience` (GENERATED ALWAYS AS)
- Avoids inconsistency between XP and level
- Still queryable and indexable

**2. JSONB for Semi-Structured Data:**

- `hack_operations.tools_used`: Array of tool IDs
- `hack_operations.result_data`: Outcome details
- **Rationale:** Avoids separate `hack_tools` join table for MVP
- **Trade-off:** Less queryable than normalized, but acceptable for this use case

**When to denormalize further:**

- If `JOIN` performance becomes bottleneck (measure first)
- If specific aggregates are queried frequently (e.g., player stats)
- Use materialized views or computed columns

---

## Constraints & Invariants

### Primary Constraints

1. **Resource Non-Negativity:**

   ```sql
   CHECK (energy >= 0)
   CHECK (money >= 0)
   CHECK (experience >= 0)
   ```

2. **Capacity Limits:**

   ```sql
   CHECK (energy <= energy_max)
   CHECK (firewall_level BETWEEN 0 AND 100)
   CHECK (level BETWEEN 1 AND 5) -- for defenses
   ```

3. **Uniqueness Constraints:**

   ```sql
   UNIQUE (username) -- users
   UNIQUE (user_id)  -- players (enforces 1:1)
   UNIQUE (ip_address) -- computers
   UNIQUE (computer_id, defense_type) -- defenses
   UNIQUE (player_id, unlock_key) -- progression_unlocks
   ```

4. **Temporal Constraints:**
   ```sql
   CHECK (completion_at > started_at) -- hack_operations
   ```

### Application-Level Constraints

Some invariants are enforced at the application layer (not DB):

1. **Self-Hacking Prevention:**
   - Attacker cannot hack their own computers
   - Validated in domain service before creating `HackOperation`
   - Could add DB trigger if needed

2. **Concurrent Operation Limits:**
   - Player can have max 3 simultaneous in-progress hacks
   - Checked before INSERT into `hack_operations`

3. **Minimum Computer Requirement:**
   - Each player must have at least one computer
   - Enforced during player creation and before computer deletion

---

## Data Types & Conventions

### Standard Types

- **IDs:** `UUID` (v4, random)
- **Timestamps:** `TIMESTAMPTZ` (always with timezone)
- **Money/Resources:** `BIGINT` (supports large values without overflow)
- **Counters:** `INTEGER` (sufficient for levels, skill points)
- **Strings:** `VARCHAR(N)` with explicit length
- **Booleans:** `BOOLEAN` (never NULL, always DEFAULT)

### Enumerations

Defined as PostgreSQL native ENUMs:

- `hack_status`
- `hack_type`
- `defense_type`
- `unlock_type`

**Advantages:**

- Type safety at DB level
- Documented in schema
- Compact storage (int internally)

**Evolution:**

- Adding values: `ALTER TYPE hack_type ADD VALUE 'new_type'`
- Cannot remove values easily (requires recreation)

### JSONB Usage

**Appropriate for:**

- Arrays of primitive values (`tools_used`)
- Dynamic result data (`result_data`)
- Optional/flexible attributes

**Not appropriate for:**

- Core entity attributes (use typed columns)
- Data requiring complex JOINs
- Frequently filtered/sorted data

---

## Indexes & Performance

See [indexing-strategy.md](indexing-strategy.md) for comprehensive indexing plan.

**Summary:**

- All foreign keys indexed
- Partial indexes for filtered queries (`WHERE is_online = true`)
- GIN indexes for JSONB columns
- Composite indexes for common query patterns

---

## Schema Evolution Strategy

See [migration-strategy.md](migration-strategy.md) for migration approach.

**Key Principles:**

- Backward-compatible changes preferred
- Transactional migrations
- Online schema changes (CONCURRENTLY for indexes)
- Version-controlled migration files

---

## Seed Data (Initial State)

### Default User + Player

Upon first registration:

```sql
-- User created via registration endpoint
INSERT INTO users (username, password_hash, email) VALUES (...);

-- Player automatically created
INSERT INTO players (user_id, display_name) VALUES (...);

-- Default computer created
INSERT INTO computers (owner_id, name, ip_address) VALUES (...);

-- Starter unlocks granted
INSERT INTO progression_unlocks (player_id, unlock_type, unlock_key) VALUES
  (:player_id, 'tool', 'basic_scanner'),
  (:player_id, 'tool', 'weak_exploit');
```

### Reference Data (Future)

- Tool definitions (separate `tools` table if needed)
- Level thresholds (for XP → level calculation)
- Unlock prerequisites (for progression tree)

---

## Summary

The schema design:

- ✅ Fully normalized (3NF) with controlled denormalization
- ✅ Enforces domain invariants via DB constraints
- ✅ Supports 1:1, 1:N, N:M relationships correctly
- ✅ Uses PostgreSQL-specific features (JSONB, enums, computed columns)
- ✅ Optimized for real-time access patterns
- ✅ Evolvable via transactional migrations

**Status:** Ready for TypeORM entity implementation.
