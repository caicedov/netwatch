# Monorepo Conventions

## Overview

Clear conventions reduce friction and prevent decisions from being made repeatedly. This document defines naming, import rules, versioning, and integration patterns.

**Core principle:** Convention over configuration. Consistency over flexibility.

---

## Naming Conventions

### Package Names

All internal packages are scoped under `@netwatch`:

- `@netwatch/domain` — Domain models
- `@netwatch/contracts` — API/event contracts
- `@netwatch/config` — Tooling configuration
- `@netwatch/tsconfig` — TypeScript base configs

**Format:** Lowercase with hyphens. No abbreviations.

```json
{
  "name": "@netwatch/domain"
}
```

---

### Folder Names

- **Apps:** Lowercase, singular nouns. `apps/backend`, `apps/frontend`
- **Packages:** Lowercase, singular nouns. `packages/domain`, `packages/contracts`
- **Modules (NestJS):** Lowercase, plural nouns. `modules/players`, `modules/hacks`, `modules/auth`
- **Subdirectories:** Descriptive, lowercase. `src/`, `test/`, `dist/`, `infrastructure/`, `domain/`, `persistence/`

**Anti-patterns:**

- ❌ `apps/game-backend` (verbose)
- ❌ `packages/util` (vague)
- ❌ `modules/player_management` (underscore)
- ✅ `apps/backend`
- ✅ `packages/domain`
- ✅ `modules/players`

---

### File Names

#### TypeScript Files

- **Entities:** `user.entity.ts`, `player.entity.ts`
- **Value Objects:** `money.value-object.ts`, `energy.value-object.ts`
- **Aggregates:** `player.aggregate.ts`
- **Domain Events:** `player-created.event.ts`
- **Services (NestJS):** `player.service.ts`
- **Controllers:** `player.controller.ts`
- **Repositories:** `player.repository.ts`
- **Mappers:** `player.mapper.ts`
- **Use Cases:** `create-player.usecase.ts`
- **Modules:** `players.module.ts`
- **Hooks (React):** `use-game-state.ts`, `use-websocket.ts`
- **Components:** `GameBoard.tsx`, `PlayerStats.tsx` (PascalCase)

**Format:**

- `entity.ts` → lowercase, descriptive
- `Entity.tsx` → PascalCase for React components
- `create-player.usecase.ts` → Kebab-case for multi-word files

**Anti-patterns:**

- ❌ `player.ts` (ambiguous—is it entity, aggregate, or service?)
- ❌ `PlayerService.ts` (inconsistent casing)
- ❌ `create_player_usecase.ts` (underscore)
- ✅ `player.entity.ts`
- ✅ `player.service.ts`
- ✅ `create-player.usecase.ts`

#### Configuration Files

- `tsconfig.json` — TypeScript config
- `.biomerc.json` — Biome linter/formatter
- `jest.config.js` — Jest test config
- `turbo.json` — Turborepo config
- `pnpm-workspace.yaml` — pnpm workspace definition

---

### Database Objects

#### Table Names

- Lowercase, plural nouns
- Reflect the aggregate they store
- Examples: `users`, `players`, `computers`, `hacks`, `defenses`

#### Column Names

- Lowercase, snake_case
- Descriptive, avoid abbreviations
- Foreign keys: `<entity>_id` (e.g., `user_id`, `owner_id`)
- Booleans: Prefix with `is_` (e.g., `is_active`, `is_online`)
- Timestamps: Suffix with `_at` (e.g., `created_at`, `updated_at`)
- Examples:
  - `id`, `user_id`, `owner_id`
  - `display_name`, `username`
  - `energy`, `energy_max`, `money`
  - `is_active`, `is_online`
  - `created_at`, `last_login_at`

**Anti-patterns:**

- ❌ `user` (singular)
- ❌ `userName` (camelCase)
- ❌ `active` (unclear boolean)
- ❌ `created` (unclear timestamp)
- ✅ `users`
- ✅ `user_name`
- ✅ `is_active`
- ✅ `created_at`

---

### Class and Type Names

- **Entities/Aggregates:** PascalCase, singular, descriptive
  - `User`, `Player`, `Computer`, `Hack`
- **Value Objects:** PascalCase, descriptive
  - `Money`, `Energy`, `IPAddress`, `Skill`
- **DTOs (Data Transfer Objects):** PascalCase, with suffix
  - `CreatePlayerRequestDto`, `PlayerResponseDto`, `CreateHackRequestDto`
- **Interfaces:** PascalCase, descriptive (avoid `I` prefix)
  - `Repository`, `Service`, `EventBus` (not `IRepository`)
- **Enums:** PascalCase, descriptive
  - `HackStatus`, `DefenseType`, `PlayerRole`

**Anti-patterns:**

- ❌ `IPlayer` (Hungarian notation)
- ❌ `player_entity` (snake_case)
- ❌ `PLAYER` (all caps)
- ✅ `Player`
- ✅ `PlayerEntity`
- ✅ `CreatePlayerRequestDto`

---

## Import Rules

### Principle

**Unidirectional dependency flow:** Domain → Contracts → Backend/Frontend

**Visual:**

```
Apps (Backend, Frontend)
      ↓ depends on ↓
Shared Packages (Domain, Contracts, Config)
```

### Backend Import Rules

```typescript
// ✅ ALLOWED

// 1. Import from own module (siblings)
import { PlayerService } from './player.service';

// 2. Import from shared packages
import { Player, Money } from '@netwatch/domain';
import { CreatePlayerRequestDto } from '@netwatch/contracts';

// 3. Import from NestJS
import { Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// 4. Import from node/npm packages
import { v4 as uuid } from 'uuid';

// ❌ FORBIDDEN

// 1. Do NOT import from apps/frontend
import { GameBoard } from 'apps/frontend/src/components/GameBoard';

// 2. Do NOT import from other modules (use dependency injection instead)
import { ComputerService } from '../computers/computer.service';
// INSTEAD: Inject via constructor
constructor(private computerService: ComputerService) {}

// 3. Do NOT import internal files from shared packages
import { Player } from '@netwatch/domain/src/entities/player.entity';
// INSTEAD: Use barrel export
import { Player } from '@netwatch/domain';
```

### Frontend Import Rules

```typescript
// ✅ ALLOWED

// 1. Import from own routes/components
import { GameBoard } from "@/components/GameBoard";

// 2. Import from shared packages
import { Player, Money } from "@netwatch/domain";
import { GameStateUpdatedEvent } from "@netwatch/contracts";

// 3. Import from React/Next.js
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 4. Import from npm packages
import { io } from "socket.io-client";

// ❌ FORBIDDEN

// 1. Do NOT import backend code
import { PlayerService } from "apps/backend/src/modules/players/player.service";

// 2. Do NOT import internal files from shared packages
import { PlayerAggregate } from "@netwatch/domain/src/aggregates/player.aggregate";
// INSTEAD: Use barrel export
import { PlayerAggregate } from "@netwatch/domain";

// 3. Do NOT reach inside other feature modules
import { internal } from "../components/internal-helper";
```

### Shared Package Export Rules

Each shared package has a **single public interface** through `src/index.ts`.

#### `packages/domain/src/index.ts`

```typescript
// Export domain models only (not implementation details)

// Entities
export { User } from "./entities/user.entity";
export { Player } from "./entities/player.entity";
export { Computer } from "./entities/computer.entity";

// Value Objects
export { Money } from "./value-objects/money";
export { Energy } from "./value-objects/energy";
export { IPAddress } from "./value-objects/ip-address";

// Aggregates
export { PlayerAggregate } from "./aggregates/player.aggregate";

// Domain Events
export { PlayerCreated } from "./events/player-created.event";
export { HackExecuted } from "./events/hack-executed.event";

// Types (if not exported via class definitions)
export type { PlayerId } from "./entities/player.entity";
```

**Inside domain files:**

```typescript
// ❌ DO NOT:
export * from "./entities"; // Wildcard exports hide public API

// ✅ DO:
export { Player } from "./entities/player";
export { Computer } from "./entities/computer";
```

#### `packages/contracts/src/index.ts`

```typescript
// Export all contract types
export * from "./api";
export * from "./events";
```

**Subdirectories organize, but index.ts is the gate:**

```
contracts/src/
├── api/
│   ├── auth.contracts.ts
│   ├── players.contracts.ts
│   └── index.ts (re-exports from this folder)
├── events/
│   ├── game-events.ts
│   ├── action-events.ts
│   └── index.ts (re-exports from this folder)
└── index.ts (re-exports from api/ and events/)
```

---

## Versioning

### Workspace Versioning

All packages share the **same version** (monorepo single-version approach). This simplifies dependency management.

**Location:** `package.json` at monorepo root.

```json
{
  "version": "0.1.0"
}
```

**Per-package `package.json`:**

```json
{
  "name": "@netwatch/domain",
  "version": "0.1.0"
}
```

Update the root version, then sync all `package.json` files:

```bash
pnpm version patch      # or minor, major
# Automatically updates all package.json files
```

### Semantic Versioning

- `0.1.0` → MVP phase (breaking changes expected, minor version increments)
- `1.0.0` → Stable release (commit to semantic versioning)

### Pre-Release Versions

For experimental branches, use pre-release tags:

```bash
pnpm version prerelease --preid=alpha
# Result: 0.1.1-alpha.0
```

---

## Module Organization

### Backend Module Structure

Each NestJS module follows a consistent pattern:

```
apps/backend/src/modules/<domain>/
├── domain/                          # Pure domain logic
│   ├── <domain>.entity.ts
│   ├── <domain>.aggregate.ts
│   └── ...
│
├── application/                     # Use cases, orchestration
│   ├── create-<domain>.usecase.ts
│   ├── update-<domain>.usecase.ts
│   └── ...
│
├── infrastructure/                  # External concerns
│   ├── persistence/
│   │   ├── <domain>.repository.ts
│   │   └── <domain>.mapper.ts
│   ├── http/                        # HTTP-specific adapters (if needed)
│   └── ...
│
├── presentation/                    # HTTP controllers
│   └── <domain>.controller.ts
│
└── <domain>.module.ts              # NestJS module definition
```

**Rules:**

- Domain layer **never imports** from infrastructure or presentation
- Application layer **never imports** from presentation
- Presentation layer **depends on** application and domain
- Infrastructure imports domain and application only

**Dependency direction (acyclic):**

```
Presentation
     ↑
Application
     ↑
Domain
```

### Frontend Component Organization

```
apps/frontend/src/
├── app/                             # Next.js route segments
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (game)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── layout.tsx
│
├── components/                      # Reusable UI components
│   ├── GameBoard.tsx
│   ├── PlayerStats.tsx
│   ├── HackAction.tsx
│   └── ...
│
├── hooks/                           # Custom React hooks
│   ├── use-game-state.ts
│   ├── use-websocket.ts
│   └── use-auth.ts
│
├── lib/                             # Utilities and clients
│   ├── api-client.ts                # HTTP client
│   ├── websocket-client.ts          # WebSocket client
│   ├── event-handlers.ts
│   └── utils.ts
│
├── store/                           # State management
│   ├── game-store.ts
│   ├── auth-store.ts
│   └── ...
│
└── styles/                          # Global styles
    └── globals.css
```

**Component naming:**

- `PascalCase.tsx` for React components
- `kebab-case.ts` for utilities and hooks

**Import pattern (path aliases):**

```typescript
// In next.config.js or tsconfig
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  }
}

// Usage:
import { GameBoard } from '@/components/GameBoard';
import { useGameState } from '@/hooks/use-game-state';
```

---

## Shared Code Rules

### When to Shared Code?

**Share when:**

- Both backend and frontend need the **same type definition**
- Example: `Player`, `Computer`, `Money` types
- Example: API contract types (request/response shapes)
- Example: Real-time event types

**Do NOT share when:**

- Backend-specific logic (repositories, services)
- Frontend-specific logic (React hooks, components)
- Infrastructure code (HTTP handlers, WebSocket setup)

### Code Review Checklist for Shared Packages

Before adding code to `@netwatch/domain` or `@netwatch/contracts`:

- [ ] Is this needed by **both** backend AND frontend?
- [ ] Does it have **no framework imports** (NestJS, React, HTTP libraries)?
- [ ] Is it **immutable** or **purely functional**?
- [ ] Is it **well-documented** (purpose, usage example)?
- [ ] Does it **follow domain-driven design** principles?
- [ ] Can it be removed without breaking either backend or frontend?

If you answer "no" to any question, it belongs in the app, not the shared package.

---

## Database Integration Rules

### Repository Location

- **Path:** `apps/backend/src/modules/<domain>/infrastructure/persistence/<domain>.repository.ts`
- **Scope:** Private to the module (only used by application services in the same module)
- **Interface:** Exposes aggregate operations (`save()`, `findById()`, `delete()`, etc.)

### Database Mapping Rule

**One table per Aggregate Root.**

Given the domain model, the mapping is:

| Table       | Aggregate Root                       | Located In                                         |
| ----------- | ------------------------------------ | -------------------------------------------------- |
| `users`     | `User` (entity)                      | `modules/auth` (if separated) or `modules/players` |
| `players`   | `PlayerAggregate`                    | `modules/players`                                  |
| `computers` | Part of `PlayerAggregate` (nested)   | Persisted with `players` table via foreign key     |
| `hacks`     | Part of `PlayerAggregate` (nested)   | Persisted via foreign key to `players`             |
| `defenses`  | Part of `ComputerAggregate` (nested) | Persisted via foreign key to `computers`           |

### Mapper Responsibility

Mappers reconstruct aggregates from database rows and enforce invariants.

```typescript
// apps/backend/src/modules/players/infrastructure/mappers/player.mapper.ts

export class PlayerMapper {
  static toDomain(raw: any): PlayerAggregate {
    // 1. Parse database row
    // 2. Reconstruct value objects (Money, Energy, etc.)
    // 3. Enforce domain invariants
    // 4. Return domain aggregate

    const player = new PlayerAggregate({
      id: raw.id,
      userId: raw.user_id,
      displayName: raw.display_name,
      energy: new Energy(raw.energy, raw.energy_max),
      money: new Money(raw.money),
      // ... other fields
    });

    // Validate invariants after reconstruction
    if (!player.isValid()) {
      throw new DomainError("Invalid player state from database");
    }

    return player;
  }

  static toPersistence(aggregate: PlayerAggregate): any {
    // Convert aggregate to database row format
    // Safe to mutate the result (not the aggregate)
    return {
      id: aggregate.id,
      user_id: aggregate.userId,
      display_name: aggregate.displayName,
      energy: aggregate.energy.current,
      energy_max: aggregate.energy.max,
      money: aggregate.money.amount,
      // ... other fields
    };
  }
}
```

### Use Case → Repository Pattern

Use cases orchestrate business logic; repositories handle persistence.

```typescript
// apps/backend/src/modules/players/application/create-player.usecase.ts

@Injectable()
export class CreatePlayerUseCase {
  constructor(private playerRepository: PlayerRepository) {}

  async execute(command: CreatePlayerCommand): Promise<Player> {
    // 1. Create domain aggregate
    const player = PlayerAggregate.create({
      userId: command.userId,
      displayName: command.displayName,
    });

    // 2. Persist to database
    await this.playerRepository.save(player);

    // 3. Return result
    return player;
  }
}
```

---

## Real-Time Event Integration

### Event Definition Location

Events are defined in `@netwatch/contracts/src/events/`.

```typescript
// packages/contracts/src/events/action-events.ts

export interface HackStartedEvent {
  type: 'hack:started';
  timestamp: number;
  payload: {
    hackerPlayerId: string;
    targetComputerId: string;
    hackId: string;
    estimatedDuration: number;
  };
}

export interface HackCompletedEvent {
  type: 'hack:completed';
  timestamp: number;
  payload: {
    hackId: string;
    success: boolean;
    reward?: {
      money: number;
      experience: number;
    };
  };
}

export type GameEvent = HackStartedEvent | HackCompletedEvent | /* ... */;
```

### Backend Event Publishing

NestJS modules publish events when domain events occur.

```typescript
// apps/backend/src/modules/hacks/presentation/hack.controller.ts

@Controller("hacks")
export class HackController {
  constructor(
    private executeHackUseCase: ExecuteHackUseCase,
    private eventGateway: EventGateway, // WebSocket publisher
  ) {}

  @Post("execute")
  async executeHack(@Body() dto: ExecuteHackDto) {
    const hack = await this.executeHackUseCase.execute(dto);

    // Publish event to all connected clients
    this.eventGateway.broadcast("hack:completed", {
      hackId: hack.id,
      success: hack.isSuccessful,
      // ...
    });

    return hack;
  }
}
```

### Frontend Event Subscription

Frontend subscribes to events via WebSocket.

```typescript
// apps/frontend/src/hooks/use-game-state.ts

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialState);

  useEffect(() => {
    const socket = io("ws://localhost:3000");

    socket.on("hack:completed", (event: HackCompletedEvent) => {
      // Update local game state
      setGameState((prev) => ({
        ...prev,
        lastHack: event,
      }));
    });

    return () => socket.disconnect();
  }, []);

  return gameState;
}
```

---

## TypeScript Configuration Hierarchy

### Root `tsconfig.json`

```json
{
  "extends": "./packages/tsconfig/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@netwatch/*": ["packages/*/src"]
    }
  }
}
```

### App-Specific `tsconfig.json`

```json
{
  "extends": "@netwatch/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### React App `tsconfig.json`

```json
{
  "extends": "@netwatch/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Summary: Quick Reference

| Aspect        | Rule                                                              |
| ------------- | ----------------------------------------------------------------- |
| Package names | Scoped: `@netwatch/*`                                             |
| Folder names  | Lowercase, singular (except modules/plural)                       |
| File names    | Lowercase, descriptive suffix (`.entity.ts`, `.service.ts`, etc.) |
| Class names   | PascalCase, no prefixes                                           |
| DB tables     | Lowercase, plural                                                 |
| DB columns    | snake_case, descriptive                                           |
| Imports       | Unidirectional: Domain → Apps                                     |
| Exports       | Only via barrel exports (`index.ts`)                              |
| Shared code   | Types + contracts only, no logic                                  |
| Repositories  | In `infrastructure/persistence/`, private to module               |
| Events        | Defined in `@netwatch/contracts`, published by backend            |
| Versioning    | Single version for all packages                                   |

**Golden rule:** If it's unclear where a file belongs or what it depends on, the convention is broken. Simplify.
