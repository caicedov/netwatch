# Monorepo Architecture Summary

## One-Page Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                          netwatch Monorepo                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  apps/                          packages/                         │
│  ├── backend (NestJS)           ├── domain (pure models)         │
│  └── frontend (Next.js)         ├── contracts (API/events)      │
│                                 ├── config (tooling)            │
│                                 └── tsconfig (TS configs)       │
│                                                                    │
│  Build with Turborepo + pnpm                                    │
│  TypeScript everywhere                                            │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Dependency Flow (Unidirectional)

```
                    ┌─────────────────────┐
                    │   apps/backend      │
                    │   apps/frontend     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  @netwatch/domain   │
                    │ @netwatch/contracts │
                    └────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ External libraries  │
                    │ (React, NestJS,     │
                    │  PostgreSQL, etc.)  │
                    └────────────────────┘

✅ Apps depend on shared packages
❌ Apps never depend on each other
❌ Shared packages never depend on apps
```

---

## Backend Module Structure

```
modules/<domain>/
├── domain/              Pure domain models (no framework)
├── application/         Use cases (orchestration logic)
├── infrastructure/      Repositories, mappers, DB queries
├── presentation/        HTTP controllers
└── <domain>.module.ts   NestJS module definition

Import direction (strict):
  Presentation → Application → Domain
  Infrastructure → Domain
  (No circular dependencies)
```

---

## Persistence Layer Rules

| What           | Where                         | Who Owns         | Can Import         |
| -------------- | ----------------------------- | ---------------- | ------------------ |
| Aggregate Root | `domain/`                     | Domain architect | Nothing            |
| Repository     | `infrastructure/persistence/` | Backend engineer | Domain, NestJS     |
| Mapper         | `infrastructure/mappers/`     | Backend engineer | Domain             |
| Use Case       | `application/`                | Backend engineer | Domain, Repository |
| Controller     | `presentation/`               | Backend engineer | Use Case           |

**Rule:** Repositories are **private to module**. Don't import across modules.

---

## Key Decisions & Rationale

| Decision                                | Why                                 | Consequence                           |
| --------------------------------------- | ----------------------------------- | ------------------------------------- |
| **Turborepo + pnpm**                    | Fast, explicit pipelines            | Single `pnpm install`, monorepo tasks |
| **Single version**                      | Simplifies dependency management    | All packages bump together            |
| **Unidirectional imports**              | Prevents coupling and circular deps | Easy to refactor shared code          |
| **Repositories in modules**             | Encapsulation, clear ownership      | Easy to change persistence later      |
| **Domain models in `@netwatch/domain`** | Shared types, no duplication        | Backend and frontend stay aligned     |
| **Contracts in `@netwatch/contracts`**  | Single source of truth for APIs     | API changes coordinated               |
| **No framework imports in domain**      | Domain stays testable and portable  | Pure TypeScript everywhere            |

---

## Backend Persistence Example

**Domain model (packages/domain):**

```typescript
class PlayerAggregate {
  id: PlayerId;
  energy: Energy;
  money: Money;

  constructor(props) {
    /* ... */
  }
}
```

**Repository (apps/backend/modules/players/infrastructure/persistence):**

```typescript
class PlayerRepository {
  async save(player: PlayerAggregate): Promise<void> {
    const row = PlayerMapper.toPersistence(player);
    await this.db.insert("players", row);
  }

  async findById(id: PlayerId): Promise<PlayerAggregate | null> {
    const row = await this.db.query("SELECT * FROM players WHERE id = $1", [
      id,
    ]);
    return row ? PlayerMapper.toDomain(row) : null;
  }
}
```

**Mapper (apps/backend/modules/players/infrastructure/mappers):**

```typescript
class PlayerMapper {
  static toDomain(raw: any): PlayerAggregate {
    return new PlayerAggregate({
      id: raw.id,
      energy: new Energy(raw.energy, raw.energy_max),
      money: new Money(raw.money),
    });
  }

  static toPersistence(agg: PlayerAggregate): any {
    return {
      id: agg.id,
      energy: agg.energy.current,
      energy_max: agg.energy.max,
      money: agg.money.amount,
    };
  }
}
```

---

## Shared Package Boundaries

### `@netwatch/domain`

**Contains:**

- Entities (User, Player, Computer)
- Value Objects (Money, Energy, IPAddress)
- Aggregates (PlayerAggregate)
- Domain Events

**Contains NOT:**

- NestJS decorators
- React hooks
- Database queries
- HTTP handlers

**Usage:**

```typescript
import { Player, Money } from "@netwatch/domain";
```

### `@netwatch/contracts`

**Contains:**

- HTTP DTOs (CreatePlayerRequestDto)
- WebSocket event types (HackCompletedEvent)
- API response schemas

**Contains NOT:**

- Business logic
- NestJS/React specifics
- Database references

**Usage:**

```typescript
import {
  CreatePlayerRequestDto,
  HackCompletedEvent,
} from "@netwatch/contracts";
```

---

## Import Rules at a Glance

### Backend ✅

```typescript
import { Player } from "@netwatch/domain";
import { CreatePlayerRequestDto } from "@netwatch/contracts";
import { Injectable } from "@nestjs/common";
import { PostgresClient } from "pg";
```

### Backend ❌

```typescript
import { GameBoard } from "apps/frontend/components"; // Forbidden
import { PlayerService } from "../hacks/player.service"; // Use injection
import internal from "@netwatch/domain/src/internal"; // Use barrel export
```

### Frontend ✅

```typescript
import { Player } from "@netwatch/domain";
import { HackCompletedEvent } from "@netwatch/contracts";
import { useState } from "react";
import { useRouter } from "next/navigation";
```

### Frontend ❌

```typescript
import { PlayerService } from "apps/backend/modules/players"; // Forbidden
import { PostgresClient } from "pg"; // Backend only
import internal from "@netwatch/domain/src/entities/player"; // Use barrel export
```

---

## File Naming Quick Reference

| Item         | Example                    | Format                 |
| ------------ | -------------------------- | ---------------------- |
| Entity       | `user.entity.ts`           | entity-name.entity.ts  |
| Value Object | `money.value-object.ts`    | name.value-object.ts   |
| Aggregate    | `player.aggregate.ts`      | name.aggregate.ts      |
| Repository   | `player.repository.ts`     | name.repository.ts     |
| Mapper       | `player.mapper.ts`         | name.mapper.ts         |
| Service      | `player.service.ts`        | name.service.ts        |
| Controller   | `player.controller.ts`     | name.controller.ts     |
| Use Case     | `create-player.usecase.ts` | action-name.usecase.ts |
| Module       | `players.module.ts`        | plural-name.module.ts  |
| Hook         | `use-game-state.ts`        | use-kebab-name.ts      |
| Component    | `GameBoard.tsx`            | PascalCase.tsx         |
| Utility      | `helpers.ts`               | kebab-case.ts          |

---

## Database Mapping Quick Reference

| Table       | Aggregate                   | Located In                |
| ----------- | --------------------------- | ------------------------- |
| `users`     | User (entity)               | auth/domain or shared     |
| `players`   | PlayerAggregate             | modules/players/domain    |
| `computers` | Nested in PlayerAggregate   | Persisted via foreign key |
| `hacks`     | Nested in PlayerAggregate   | Persisted via foreign key |
| `defenses`  | Nested in ComputerAggregate | Persisted via foreign key |

**Rule:** One aggregate per table. Nested objects have foreign keys.

---

## Turborepo Task Reference

| Task              | Purpose              | Cache | Persistent |
| ----------------- | -------------------- | ----- | ---------- |
| `pnpm build`      | Compile all packages | ✓     | ✗          |
| `pnpm dev`        | Start dev servers    | ✗     | ✓          |
| `pnpm test`       | Run all tests        | ✓     | ✗          |
| `pnpm test:watch` | Watch mode tests     | ✗     | ✓          |
| `pnpm test:e2e`   | Backend API tests    | ✗     | ✗          |
| `pnpm lint`       | Check code style     | ✓     | ✗          |
| `pnpm lint:fix`   | Auto-fix style       | ✗     | ✗          |
| `pnpm type-check` | TypeScript check     | ✓     | ✗          |
| `pnpm clean`      | Reset artifacts      | N/A   | ✗          |

---

## Unblock Backend & Database Implementation

### Backend Engineer Can Now:

1. ✅ Create new modules with clear folder structure
2. ✅ Implement repositories that map aggregates to tables
3. ✅ Know exactly where persistence code lives
4. ✅ Build independently without breaking frontend
5. ✅ Test business logic without database

### Database Architect Can Now:

1. ✅ Map schemas directly to aggregates
2. ✅ Coordinate with backend via repositories
3. ✅ Define invariants at DB level
4. ✅ Validate that mappers reconstruct correctly

### Frontend Engineer Can Now:

1. ✅ Consume contracts independently
2. ✅ Build UI with typed API clients
3. ✅ Never worry about backend internals
4. ✅ Subscribe to real-time events with full type safety

---

## Success Metrics

- ✅ Backend engineer implements without restructuring folders
- ✅ Database architect maps schemas without guessing
- ✅ Frontend works independently via contracts
- ✅ Local `pnpm dev` works (both servers together)
- ✅ Tests run fast (cached, under 30 seconds)
- ✅ No circular dependencies
- ✅ New developer understands the structure in 30 minutes

---

## Next Steps

1. **Backend:** Read [structure.md - Persistence Layer Location](structure.md#persistence-layer-location)
2. **Database:** Coordinate using the mapping in [conventions.md - Database Mapping Rule](conventions.md#database-mapping-rule)
3. **Frontend:** Follow [conventions.md - Frontend Component Organization](conventions.md#frontend-component-organization)
4. **Any:** Run `pnpm dev` to start developing

**Remember:** If the structure becomes unclear, it's wrong. Simplify.
