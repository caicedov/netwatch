# Monorepo Structure

## Overview

NetWatch uses a **Turborepo-based monorepo** with **pnpm** workspaces to manage backend, frontend, and shared packages. The structure minimizes friction, prevents hidden coupling, and enables fast iteration.

**Core principle:** Clear boundaries between apps and packages. No circular dependencies. Shared code is intentional and minimal.

---

## Folder Layout

```
netwatch/
├── apps/
│   ├── backend/           # NestJS modular monolith
│   │   ├── src/
│   │   │   ├── modules/           # Feature modules (persistence, auth, game)
│   │   │   │   ├── auth/
│   │   │   │   ├── players/
│   │   │   │   ├── computers/
│   │   │   │   ├── hacks/
│   │   │   │   └── ...
│   │   │   ├── infrastructure/    # Database, HTTP, WebSocket, logging
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/          # Next.js (App Router)
│       ├── src/
│       │   ├── app/               # Route segments
│       │   ├── components/        # Reusable UI components
│       │   ├── hooks/             # Custom React hooks
│       │   ├── lib/               # Utilities, API clients
│       │   ├── store/             # State management
│       │   └── styles/
│       ├── public/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── domain/            # Pure TypeScript domain models
│   │   ├── src/
│   │   │   ├── entities/           # User, Player, Computer, Hack, etc.
│   │   │   ├── value-objects/      # Money, Energy, IP, Skill, etc.
│   │   │   ├── aggregates/         # Root aggregates (Player aggregate, etc.)
│   │   │   └── index.ts            # Public exports only
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── contracts/         # API schemas and real-time event definitions
│   │   ├── src/
│   │   │   ├── api/                # HTTP request/response types
│   │   │   │   ├── auth.contracts.ts
│   │   │   │   ├── players.contracts.ts
│   │   │   │   ├── computers.contracts.ts
│   │   │   │   └── ...
│   │   │   ├── events/             # Real-time WebSocket events
│   │   │   │   ├── game-events.ts
│   │   │   │   ├── action-events.ts
│   │   │   │   └── ...
│   │   │   └── index.ts            # Public exports only
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/            # Shared tooling configuration
│   │   ├── biome.json
│   │   ├── eslint/
│   │   ├── prettier/
│   │   └── package.json
│   │
│   └── tsconfig/          # Base TypeScript configurations
│       ├── base.json
│       ├── react.json
│       └── package.json
│
├── docs/
│   ├── product-owner/
│   ├── software-architect/
│   ├── database-architect/
│   └── monorepo-architect/       # THIS FOLDER
│       ├── structure.md           # (this file)
│       ├── turborepo-pipelines.md
│       └── conventions.md
│
├── turbo.json             # Turborepo pipeline configuration
├── pnpm-workspace.yaml    # pnpm workspace declaration
├── package.json           # Root workspace metadata
├── tsconfig.json          # Root TypeScript base config
├── .biomerc.json          # Root formatter/linter
├── .gitignore
└── README.md
```

---

## Package Responsibilities

### Apps

#### `apps/backend`

**Purpose:** Server-side game logic and data persistence.

**Technology:** NestJS + PostgreSQL + TypeScript

**Responsibilities:**

- HTTP API (authentication, game state queries)
- WebSocket server (real-time game events)
- Game logic execution and validation
- Player action handling (hacks, defense, progression)
- Database access and migrations
- Logging, monitoring, error handling

**Can depend on:**

- `@netwatch/domain` (read domain models)
- `@netwatch/contracts` (read API/event schemas)
- `@netwatch/config` (tooling only)
- NestJS ecosystem
- PostgreSQL drivers
- External services (auth, logging, etc.)

**Cannot depend on:**

- `apps/frontend` (no circular dependency)
- Browser APIs
- Frontend-specific libraries

**Isolation rule:** Backend modules communicate via NestJS dependency injection. Cross-module calls are strictly through service interfaces defined in the module.

---

#### `apps/frontend`

**Purpose:** Web-based player client.

**Technology:** Next.js (App Router) + React + TypeScript

**Responsibilities:**

- User interface and gameplay experience
- WebSocket connection management
- Client-side rendering of game state
- Player input handling and transmission
- Real-time UI updates from server events
- Authentication token management

**Can depend on:**

- `@netwatch/contracts` (read event/API schemas)
- `@netwatch/domain` (for type-safe representation of game objects)
- `@netwatch/config` (tooling only)
- React ecosystem
- Next.js framework
- WebSocket clients

**Cannot depend on:**

- `apps/backend` (no direct backend code)
- Backend-specific libraries (NestJS, ORMs, etc.)
- Server-side frameworks

**Isolation rule:** Frontend communicates with backend exclusively through contracts (HTTP API + WebSocket events). No direct code imports.

---

### Packages (Shared)

#### `packages/domain`

**Purpose:** Pure domain models—entities, value objects, aggregates—without framework or infrastructure concerns.

**Content:**

- Entities: `User`, `Player`, `Computer`, `Hack`, `Defense`, etc.
- Value Objects: `Money`, `Energy`, `IPAddress`, `SkillPoints`, `Credentials`, etc.
- Aggregates: `PlayerAggregate`, `ComputerAggregate`, etc.
- Domain Events: `PlayerCreated`, `HackExecuted`, `DefenseTriggered`, etc.
- Invariant validation: immutability, boundary checks, business rules

**Rules:**

- **No framework imports** (no NestJS, no React)
- **No infrastructure imports** (no database libraries, no HTTP clients)
- **No side effects** (pure functions, deterministic behavior)
- **Immutable value objects** (enforce with `readonly` fields)
- **Single responsibility** per class
- **Exports only public API** (use `index.ts` as barrel export)

**Used by:**

- Backend: Implement persistence layer, business logic
- Frontend: Type-safe representation of game state
- Tests: Validate domain invariants independently

**Database mapping rule:** Each table in the database maps to exactly one Aggregate Root. Example:

- `players` table → `PlayerAggregate` (with nested entities: Computer, Hack, Defense)
- `users` table → `User` entity
- See `/docs/monorepo-architect/conventions.md` for exact mapping

---

#### `packages/contracts`

**Purpose:** Shared API schemas and real-time event definitions.

**Content:**

- HTTP request/response DTOs (Data Transfer Objects)
- Real-time WebSocket event types
- Shared validation schemas
- Error response formats

**Subdirectories:**

```
contracts/src/
├── api/
│   ├── auth.contracts.ts       # Login, register, token refresh
│   ├── players.contracts.ts    # Player state queries
│   ├── computers.contracts.ts  # Computer management
│   ├── hacks.contracts.ts      # Hack execution
│   └── ...
├── events/
│   ├── game-events.ts          # GameStateUpdated, PlayerLeveledUp, etc.
│   ├── action-events.ts        # HackStarted, HackCompleted, DefenseTriggered, etc.
│   └── ...
└── index.ts                    # Public exports
```

**Rules:**

- **DTOs only** (no business logic)
- **Zod or similar** for runtime validation (optional, for safety)
- **Immutable interfaces** (use `readonly` properties)
- **No framework-specific decorators** (NestJS controllers, React hooks, etc.)
- **Backend defines structure first** (contract is contract, frontend consumes)

**Used by:**

- Backend: Define HTTP response shape, validate incoming requests
- Frontend: Type-safe API client generation, event handlers

**Contract-first principle:** Backend defines request/response structure. Frontend uses it as a contract (not the other way around). Changes to contracts require coordination.

---

#### `packages/config`

**Purpose:** Shared tooling and linting configuration.

**Content:**

- Biome configuration (formatter + linter)
- ESLint shared configs (if needed)
- Prettier config (optional, Biome preferred)

**Rules:**

- **No runtime code** (only configuration)
- **Minimal dependencies** (only tooling packages)
- **Version consistency** across monorepo

---

#### `packages/tsconfig`

**Purpose:** Base TypeScript configurations for consistent compilation.

**Content:**

- `base.json` — Common settings (target, lib, strict flags)
- `react.json` — React-specific settings

**Usage:** Every `tsconfig.json` extends from here. Example:

```json
{
  "extends": "@netwatch/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  }
}
```

---

## Dependency Graph

```
┌─────────────────────────────────────────┐
│ apps/frontend                           │
│ (Next.js + React)                       │
│ ↓ depends on ↓                          │
├─────────────────────────────────────────┤
│ @netwatch/domain (types only)           │
│ @netwatch/contracts (read)              │
│ @netwatch/config (dev-only)             │
│ @netwatch/tsconfig (dev-only)           │
└─────────────────────────────────────────┘
            ↑ (WebSocket)
            │ (HTTP API)
            │
┌─────────────────────────────────────────┐
│ apps/backend                            │
│ (NestJS + PostgreSQL)                   │
│ ↓ depends on ↓                          │
├─────────────────────────────────────────┤
│ @netwatch/domain (read)                 │
│ @netwatch/contracts (read)              │
│ @netwatch/config (dev-only)             │
│ @netwatch/tsconfig (dev-only)           │
└─────────────────────────────────────────┘

No app-to-app dependencies.
No circular dependencies.
Shared packages have no internal dependencies on apps.
```

---

## Persistence Layer Location

**Requirement:** The database architect and backend engineer must have explicit rules about where persistence code lives.

### Database Repository Pattern

Repositories are **not** part of the domain layer. They live in the **backend infrastructure** and follow NestJS conventions.

```
apps/backend/src/
├── modules/
│   ├── players/
│   │   ├── domain/                    # Player aggregate root
│   │   │   └── player.aggregate.ts
│   │   ├── application/               # Use cases (application services)
│   │   │   └── create-player.usecase.ts
│   │   ├── infrastructure/            # Repositories, database mappers
│   │   │   ├── persistence/
│   │   │   │   └── player.repository.ts
│   │   │   └── mappers/
│   │   │       └── player.mapper.ts
│   │   ├── presentation/              # HTTP controllers
│   │   │   └── player.controller.ts
│   │   └── players.module.ts
│   │
│   └── ...
│
└── infrastructure/
    ├── database/
    │   ├── migrations/
    │   ├── seeds/
    │   └── connection.ts              # Shared database connection
    └── logging/
        └── ...
```

### Persistence Rules

1. **Repositories live in `modules/<domain>/infrastructure/persistence/`**
   - Each repository maps one aggregate to one database table
   - Repositories are private to their module (not exported to other modules)

2. **Database mappers live in `modules/<domain>/infrastructure/mappers/`**
   - Mappers convert database rows to domain objects
   - Mappers enforce domain invariants during reconstruction
   - Example: `PlayerMapper.toDomain(row)` → `PlayerAggregate`

3. **Queries are module-scoped**
   - Each module owns the SQL for its aggregate
   - Read models (if needed for performance) live in a dedicated module

4. **Database connection is shared infrastructure**
   - `apps/backend/src/infrastructure/database/connection.ts`
   - All repositories use the same connection pool
   - Transactions are handled at the NestJS provider level

5. **Migrations are centralized**
   - `apps/backend/src/infrastructure/database/migrations/`
   - Each migration file corresponds to a schema change
   - Naming convention: `YYYYMMDD_HHmmss_description.sql`
   - **Database architect** defines schema; **backend engineer** implements migrations

6. **No direct SQL in business logic**
   - Business logic (use cases, domain services) never calls the database directly
   - All database access goes through repositories or read-model services
   - Example: ❌ `db.query(...)` in a use case → ✅ `this.playerRepository.findById(...)`

### Example: Player Module Persistence

Given the domain model, the player persistence layer looks like:

```typescript
// apps/backend/src/modules/players/infrastructure/persistence/player.repository.ts

import { Injectable } from '@nestjs/common';
import { PlayerAggregate } from '../../domain/player.aggregate';
import { Database } from '../../../../infrastructure/database/connection';
import { PlayerMapper } from '../mappers/player.mapper';

@Injectable()
export class PlayerRepository {
  constructor(private db: Database) {}

  async save(player: PlayerAggregate): Promise<void> {
    // Insert or update player in DB
    // Validate invariants
    // Handle nested aggregates (computers, hacks)
  }

  async findById(playerId: string): Promise<PlayerAggregate | null> {
    // SELECT * FROM players WHERE id = $1
    // SELECT * FROM computers WHERE owner_id = $1
    // Map rows to PlayerAggregate (with nested computers)
    const row = await this.db.query(...);
    return row ? PlayerMapper.toDomain(row) : null;
  }

  async findAll(): Promise<PlayerAggregate[]> {
    // SELECT all players with their computers
  }
}
```

```typescript
// apps/backend/src/modules/players/infrastructure/mappers/player.mapper.ts

export class PlayerMapper {
  static toDomain(raw: any): PlayerAggregate {
    // Reconstruct PlayerAggregate from database row
    // Enforce invariants: energy <= energy_max, level is computed, etc.
    return new PlayerAggregate({
      id: raw.id,
      user_id: raw.user_id,
      energy: raw.energy,
      energy_max: raw.energy_max,
      // ... other fields
    });
  }

  static toPersistence(player: PlayerAggregate): any {
    // Convert PlayerAggregate to database row format
    return {
      id: player.id,
      energy: player.energy,
      // ... other fields
    };
  }
}
```

---

## Summary: No Hidden Coupling

- ✅ Backend and frontend are isolated (contract-based)
- ✅ Domain models are pure (no framework, no infrastructure)
- ✅ Shared packages are minimal and intentional
- ✅ Persistence layer has explicit rules and location
- ✅ Database architect can map schemas to modules
- ✅ Backend engineer knows where repositories live and what they can depend on
- ✅ Turborepo enables fast builds and incremental changes
