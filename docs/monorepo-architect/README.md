# Monorepo Architect - Quick Start

## What Is This?

This folder documents the **Turborepo-based monorepo structure** for NetWatch. It defines:

- Where code lives (folder structure)
- How code moves between packages (dependency rules)
- How code builds and runs (Turborepo pipelines)
- How to write consistent code (conventions)

**Read these documents in this order:**

1. **[structure.md](structure.md)** — Where everything lives and why
2. **[turborepo-pipelines.md](turborepo-pipelines.md)** — How to build, test, and develop
3. **[conventions.md](conventions.md)** — How to name and organize code

---

## For Backend Engineer

**Your job:** Implement game logic and persistence layer.

**What you need to know:**

1. **Where persistence lives:**
   - Repositories: `apps/backend/src/modules/<domain>/infrastructure/persistence/<domain>.repository.ts`
   - Mappers: `apps/backend/src/modules/<domain>/infrastructure/mappers/<domain>.mapper.ts`
   - See [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) for the full pattern

2. **What you can depend on:**
   - `@netwatch/domain` — Read domain models
   - `@netwatch/contracts` — Read API/event schemas
   - NestJS ecosystem
   - PostgreSQL drivers
   - External services

3. **What you cannot depend on:**
   - `apps/frontend` — NO circular dependency
   - Direct database queries in business logic — use repositories only
   - Mixing domain logic with infrastructure

4. **How to build and test:**

   ```bash
   pnpm dev              # Start backend in watch mode
   pnpm test:watch       # Run tests in watch mode
   pnpm test:e2e         # Run API tests
   pnpm lint:fix         # Format code
   ```

5. **How to structure a new module:**
   ```
   modules/my-feature/
   ├── domain/            # Pure domain models
   ├── application/       # Use cases
   ├── infrastructure/    # Repositories, mappers, HTTP adapters
   ├── presentation/      # Controllers
   └── my-feature.module.ts
   ```

**Next steps:** Read [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) and [conventions.md - Database Integration Rules](conventions.md#database-integration-rules).

---

## For Database Architect

**Your job:** Design schema that maps to domain aggregates.

**What you need to know:**

1. **Database-to-domain mapping:**
   - Each PostgreSQL table maps to exactly one Aggregate Root
   - Example: `players` table → `PlayerAggregate` (with nested Computer, Hack)
   - See [conventions.md - Database Mapping Rule](conventions.md#database-mapping-rule)

2. **Where backend maps the database:**
   - Mappers convert rows to domain objects: `PlayerMapper.toDomain(row) → PlayerAggregate`
   - Backend enforces invariants during mapping (energy ≤ max, level is computed, etc.)
   - See [structure.md - Example: Player Module Persistence](structure.md#example-player-module-persistence)

3. **Domain invariants that the database enforces:**
   - `username` UNIQUE, 3-20 characters
   - `energy >= 0` and `energy <= energy_max`
   - `money >= 0`
   - `level` GENERATED ALWAYS from `experience`
   - See `/docs/database-architect/schema-design.md` for full schema

4. **No surprises rule:**
   - Database schema is read-only for backend (backend doesn't change schema)
   - Backend uses migrations to update schema (backend engineer writes migrations)
   - Mapper validates that database rows match domain invariants

**Next steps:** Coordinate with backend engineer using [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) as the contract.

---

## For Frontend Engineer

**Your job:** Build the player client in React/Next.js.

**What you need to know:**

1. **What you can depend on:**
   - `@netwatch/contracts` — Read event and API types
   - `@netwatch/domain` — Read domain types (for type-safe game objects)
   - React + Next.js
   - WebSocket client
   - HTTP client for authentication

2. **What you cannot depend on:**
   - `apps/backend` — No direct backend code imports
   - Backend-specific libraries (NestJS, database drivers, etc.)

3. **How to communicate with backend:**
   - HTTP: POST to `/api/auth`, `/api/hacks`, etc.
   - WebSocket: Subscribe to `game:state-updated`, `hack:completed`, etc.
   - See `@netwatch/contracts` for the exact shapes

4. **How to build and test:**

   ```bash
   pnpm dev              # Start Next.js dev server
   pnpm test:watch       # Run component tests
   pnpm lint:fix         # Format code
   ```

5. **Component organization:**
   ```
   apps/frontend/src/
   ├── app/           # Route segments (Next.js App Router)
   ├── components/    # Reusable React components
   ├── hooks/         # Custom hooks (useGameState, useWebSocket, etc.)
   ├── lib/           # Utilities (API client, WebSocket client)
   └── store/         # State management
   ```

**Next steps:** Read [conventions.md - Frontend Component Organization](conventions.md#frontend-component-organization).

---

## For Any Developer

### Quick Commands

```bash
# Start developing
pnpm install          # Install all packages (once)
pnpm dev              # Start backend + frontend dev servers

# In another terminal
pnpm test:watch       # Run tests in watch mode while developing

# Before committing
pnpm lint:fix         # Auto-format code
pnpm type-check       # Check types
pnpm test             # Run all tests

# If something breaks
pnpm clean            # Remove all artifacts
pnpm build            # Rebuild everything
pnpm test             # Run tests
```

### Key Rules (Don't Break These)

1. **No circular imports:** Frontend cannot import backend. Backend cannot import frontend.
2. **All shared code goes in `packages/`:** Don't duplicate types or contracts.
3. **Domain models have no framework imports:** Pure TypeScript only.
4. **Only import from barrel exports:** Don't reach into `@netwatch/domain/src/entities/player.entity`. Use `@netwatch/domain` instead.
5. **Repositories are private to modules:** Don't import `PlayerRepository` into other modules. Inject the service instead.
6. **One line of responsibility per file:** If a file has `entity`, `service`, AND `controller` in it, split it.

### Import Cheat Sheet

```typescript
// ✅ Backend
import { Player, Money } from "@netwatch/domain";
import { CreatePlayerRequestDto } from "@netwatch/contracts";
import { Injectable } from "@nestjs/common";

// ✅ Frontend
import { Player } from "@netwatch/domain";
import { HackCompletedEvent } from "@netwatch/contracts";
import { useRouter } from "next/navigation";

// ❌ DO NOT
import { PlayerService } from "apps/backend/.."; // Frontend importing backend
import { GameBoard } from "apps/frontend/.."; // Backend importing frontend
import internal from "@netwatch/domain/src/internal"; // Reach inside packages
```

---

## Decisions Made (Non-Negotiable)

| Decision                     | Why                                               | Impact                                       |
| ---------------------------- | ------------------------------------------------- | -------------------------------------------- |
| **Turborepo**                | Fast builds, clear task pipelines, single version | You follow `pnpm` and read `turbo.json`      |
| **pnpm workspaces**          | Fast, disk-efficient, symlink-based               | Install with `pnpm`, not `npm`               |
| **TypeScript everywhere**    | Type-safe across backend and frontend             | No JavaScript files in source                |
| **Monolith (backend)**       | Simplicity, shared domain context, fast iteration | Modules communicate via dependency injection |
| **Modular structure**        | Supports independent feature development          | Respect module boundaries                    |
| **No implicit dependencies** | Prevents coupling and circular imports            | Always declare what you import               |

---

## Success Criteria

If these are true, the monorepo is working:

- [ ] Backend engineer can implement a feature without restructuring folders
- [ ] Frontend engineer can consume contracts without understanding backend internals
- [ ] Database architect can map schemas to modules without guessing where code lives
- [ ] A new developer can read the docs and understand the codebase in 30 minutes
- [ ] Local development works with `pnpm dev` (backend + frontend together)
- [ ] Tests run in under 30 seconds (cached)
- [ ] No file imports from both `apps/backend` and `apps/frontend`

If any of these is false, file an issue. The monorepo is not doing its job.

---

## Key Documents

- **[structure.md](structure.md)** — Folder layout, package responsibilities, dependency graph
- **[turborepo-pipelines.md](turborepo-pipelines.md)** — Build tasks, caching, local workflow
- **[conventions.md](conventions.md)** — Naming, imports, database rules, shared code rules

---

## References

- **Domain Model:** `/docs/software-architect/domain-model.md`
- **Database Schema:** `/docs/database-architect/schema-design.md`
- **Architecture Overview:** `/docs/software-architect/architecture-overview.md`
- **MVP Scope:** `/docs/product-owner/mvp-scope.md`
