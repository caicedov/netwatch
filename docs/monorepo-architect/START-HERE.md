# 🏗️ Monorepo Architect — Complete Documentation

Welcome! This folder contains the **complete design and implementation guide** for the NetWatch monorepo.

**Status:** ✅ **COMPLETE** — Monorepo is ready for backend and database implementation.

---

## What Is This?

This is a **Turborepo + pnpm monorepo** that manages:

- Backend (NestJS modular monolith)
- Frontend (Next.js with React)
- Shared packages (domain models, API contracts, tooling)

**Key achievement:** Clear boundaries between apps, preventing hidden coupling and enabling parallel development.

---

## Quick Navigation

### 🎯 I'm a... (Start Here)

| Role                     | Read First                                                         | Then Read                                                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend Engineer**     | [Backend Guide (in README.md)](README.md#for-backend-engineer-)    | [structure.md - Persistence Layer](structure.md#persistence-layer-location) + [conventions.md - Database Rules](conventions.md#database-integration-rules)           |
| **Database Architect**   | [Database Guide (in README.md)](README.md#for-database-architect-) | [structure.md - Example Persistence](structure.md#example-player-module-persistence) + [SUMMARY.md - Database Mapping](SUMMARY.md#database-mapping-quick-reference)  |
| **Frontend Engineer**    | [Frontend Guide (in README.md)](README.md#for-frontend-engineer-)  | [conventions.md - Component Organization](conventions.md#frontend-component-organization) + [DIAGRAMS.md - Event Flow](DIAGRAMS.md#6-real-time-event-flow-websocket) |
| **New to Project**       | [README.md](README.md)                                             | [SUMMARY.md](SUMMARY.md) (one-page overview)                                                                                                                         |
| **Implementing Feature** | [turborepo-pipelines.md](turborepo-pipelines.md)                   | [conventions.md](conventions.md) (naming and structure)                                                                                                              |
| **Debugging/Verifying**  | [CHECKLIST.md](CHECKLIST.md)                                       | [DIAGRAMS.md](DIAGRAMS.md) (visual references)                                                                                                                       |

### 📚 All Documents

```
docs/monorepo-architect/
│
├─ START-HERE.md ◄─ YOU ARE HERE
├─
├─ README.md                 [5 min]  Quick start guide per role
├─ SUMMARY.md               [10 min]  One-page architecture overview
├─ INDEX.md                  [5 min]  Navigation guide and document index
├─
├─ structure.md             [20 min]  Folder layout, packages, persistence rules
├─ turborepo-pipelines.md   [15 min]  Build tasks, caching, local workflow
├─ conventions.md           [20 min]  Naming, imports, database rules, shared code
├─
├─ DIAGRAMS.md              [15 min]  Visual representations and flowcharts
├─ CHECKLIST.md             [30 min]  Implementation verification checklist
├─
└─ START-HERE.md (this file)
```

**Total reading time:** ~60 minutes for complete understanding.

---

## The Problem This Solves

**Before:** Unclear folder structure, hidden coupling, circular dependencies, slow iteration.

**After:**

- ✅ Clear boundaries between backend, frontend, and shared code
- ✅ No circular dependencies (unidirectional imports)
- ✅ Backend engineer knows exactly where repositories live
- ✅ Database architect can map schemas to modules
- ✅ Frontend works independently via contracts
- ✅ Fast local development with Turborepo + pnpm
- ✅ New developers understand structure in 30 minutes

---

## The Solution at a Glance

### Folder Structure

```
apps/
├── backend/    (NestJS monolith)
└── frontend/   (Next.js + React)

packages/
├── domain/        (Pure TypeScript entities, aggregates)
├── contracts/     (API & WebSocket event schemas)
├── config/        (Shared tooling: Biome, ESLint)
└── tsconfig/      (Base TypeScript configurations)

docs/monorepo-architect/  (THIS FOLDER)
```

### Core Rules

1. **Unidirectional imports:** Apps import Shared Packages, never the reverse
2. **No app-to-app imports:** Backend ↔ Frontend (no circular dependency)
3. **Domain models are pure:** No framework, no database, no HTTP
4. **Shared code is intentional:** Only types and contracts, no logic
5. **Repositories are private:** To their module, injected via NestJS
6. **Persistence has rules:** One table per aggregate, mappers enforce invariants

### Build & Development

```bash
# Install (once)
pnpm install

# Development
pnpm dev                 # Start backend + frontend together
pnpm test:watch        # Run tests as you develop

# Before committing
pnpm lint:fix          # Auto-format code
pnpm type-check        # Check TypeScript
pnpm test              # Run all tests

# If something breaks
pnpm clean             # Reset artifacts
pnpm build             # Rebuild everything
```

---

## Key Decisions (Fixed)

| Decision                    | Why                                    | Impact                           |
| --------------------------- | -------------------------------------- | -------------------------------- |
| **Turborepo + pnpm**        | Fast, explicit, clear pipelines        | Use pnpm, read turbo.json        |
| **Single version**          | Simplifies dependency management       | All packages bump together       |
| **TypeScript everywhere**   | Type safety across project             | No JavaScript in source          |
| **Unidirectional imports**  | Prevents coupling and cycles           | Enforced by structure            |
| **Domain layer pure**       | Testable, portable, framework-agnostic | No imports outside domain        |
| **Repositories in modules** | Clear ownership and encapsulation      | Each module owns its persistence |

These decisions are **non-negotiable** without an Architectural Decision Record (ADR).

---

## Success Criteria

If all these are true, the monorepo is working:

- ✅ Backend engineer can implement a feature without restructuring folders
- ✅ Database architect can map schemas without guessing where code lives
- ✅ Frontend engineer consumes contracts without understanding backend internals
- ✅ Local `pnpm dev` works (backend + frontend together)
- ✅ Tests run in under 30 seconds (cached)
- ✅ No circular dependencies exist
- ✅ New developer understands the structure in 30 minutes
- ✅ Persistence layer rules are clear and documented

If any of these is false, the monorepo design is incomplete.

---

## What to Read Based on Your Needs

### "I need to understand the whole thing"

→ Read [SUMMARY.md](SUMMARY.md) (10 minutes) for one-page overview.

### "I'm implementing backend persistence"

→ Read [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) + [conventions.md - Database Integration Rules](conventions.md#database-integration-rules).

### "I need to know where files go"

→ Read [structure.md](structure.md) for folder layout.

### "I need to know what I can import"

→ Read [conventions.md - Import Rules](conventions.md#import-rules).

### "I need to see data flow diagrams"

→ Read [DIAGRAMS.md](DIAGRAMS.md) for visual representations.

### "I'm verifying the monorepo is set up"

→ Use [CHECKLIST.md](CHECKLIST.md) phase by phase.

### "I'm a new developer"

→ Read [README.md](README.md) for your role, then [SUMMARY.md](SUMMARY.md) for overview.

---

## Core Concepts Explained

### 1. Unidirectional Dependency Flow

```
    Backend App
       ↓
    Frontend App
       ↓
   Shared Packages
   (Domain, Contracts)
       ↓
   TypeScript Config

✅ Backend can import Domain
✅ Frontend can import Contracts
❌ Domain cannot import Backend
❌ Backend cannot import Frontend
```

**Why?** Prevents coupling and circular dependencies. Shared code stays pure and reusable.

### 2. Domain Models Are Pure

```typescript
// ✅ CORRECT: Pure domain model (no framework)
class Player {
  constructor(
    readonly id: string,
    readonly energy: Energy,
    readonly money: Money,
  ) {}

  canAfford(cost: Money): boolean {
    /* pure logic */
  }
}

// ❌ WRONG: Domain model with framework
@Entity()
class Player {
  @PrimaryKey()
  @Column()
  id: string;

  @Transient() // What is this doing here?
  energy: Energy;
}
```

**Why?** Domain models are business logic first. They're testable independently and portable across any framework.

### 3. Repositories Are Private to Modules

```typescript
// ✅ CORRECT: Dependency injection
class HackModule {
  // PlayerRepository is private to players module
  // Access via PlayerService interface (injected)

  constructor(private playerService: PlayerService) {}

  executeHack(cmd) {
    const player = await this.playerService.findById(cmd.playerId);
  }
}

// ❌ WRONG: Direct import
import { PlayerRepository } from "../players/infrastructure/persistence";
const repo = new PlayerRepository(); // Anti-pattern!
```

**Why?** Repositories are implementation details. Modules communicate via service interfaces, not implementation imports.

### 4. Database Mapping via Mappers

```typescript
// Domain aggregate
class PlayerAggregate {
  id: string;
  energy: Energy;
  computers: Computer[];
}

// Database row
{
  id: "abc123",
  energy: 100,
  // computers are separate table with FK
}

// Mapper (infrastructure layer)
class PlayerMapper {
  static toDomain(row): PlayerAggregate {
    // Reconstruct aggregate from multiple rows
    // Enforce invariants (energy ≤ energy_max)
    // Return domain object
  }

  static toPersistence(agg): any {
    // Convert aggregate to row format
    // Ready for INSERT/UPDATE
  }
}
```

**Why?** Separates persistence concerns from domain logic. Database details (normalization, foreign keys) don't leak into domain models.

---

## Typical Workflow

### Day 1: Setup

```bash
git clone <repo>
cd netwatch
pnpm install
pnpm build
pnpm test
```

### Day 2+: Feature Development

```bash
# Terminal 1: Backend + Frontend dev servers
pnpm dev

# Terminal 2: Tests in watch mode
pnpm test:watch

# Make changes to:
# - Backend: apps/backend/src/modules/<feature>/
# - Frontend: apps/frontend/src/<feature>/
# - Shared: packages/domain/ or packages/contracts/

# Before committing:
pnpm lint:fix
pnpm type-check
pnpm test
```

### When Something Breaks

```bash
# Rebuild from scratch
pnpm clean
pnpm build
pnpm test

# Or check specific package
turbo run test --scope=@netwatch/domain
```

---

## Common Questions

### Q: Where do I put the repository for a new module?

A: `apps/backend/src/modules/<domain>/infrastructure/persistence/<domain>.repository.ts`

Read [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) for the full pattern and example.

### Q: What can the backend import?

A: Domain models from `@netwatch/domain` + contracts from `@netwatch/contracts` + NestJS + database drivers.

Read [conventions.md - Backend Import Rules](conventions.md#backend-import-rules) for full list.

### Q: What can the frontend import?

A: Domain types from `@netwatch/domain` + contracts from `@netwatch/contracts` + React + Next.js + HTTP clients.

Read [conventions.md - Frontend Import Rules](conventions.md#frontend-import-rules) for full list.

### Q: How do I name a file?

A: See [conventions.md - File Names](conventions.md#file-names) for the full naming guide.

**Examples:**

- `player.entity.ts` — Entity definition
- `create-player.usecase.ts` — Use case (action-name.usecase.ts)
- `player.repository.ts` — Repository
- `PlayerStats.tsx` — React component (PascalCase)

### Q: Can I import a repository from another module?

A: **No.** Repositories are private to their module. Use dependency injection to access services instead.

Read [conventions.md - Module Organization](conventions.md#module-organization) for the pattern.

### Q: How do I add shared code?

A: Add it to `packages/domain/` (models) or `packages/contracts/` (APIs), then export via `index.ts`.

Read [conventions.md - Shared Code Rules](conventions.md#shared-code-rules) for the checklist.

### Q: What's the build order?

A: Base configs → Domain → Contracts → Apps (backend + frontend in parallel).

Read [turborepo-pipelines.md - Task Dependency Graph](turborepo-pipelines.md#task-dependency-graph) for the full graph.

### Q: Is it okay to use a shortcut here?

A: **Ask yourself:** Will this be clear to someone reading the code a year from now? If not, don't do it.

---

## Red Flags 🚩

If you see any of these, something is wrong:

| Red Flag                                  | Why It's Bad        | Fix                               |
| ----------------------------------------- | ------------------- | --------------------------------- |
| Backend imports from `apps/frontend`      | Circular dependency | Use `@netwatch/contracts` instead |
| Domain models have `@Entity()` decorators | Framework leak      | Move to mapper layer              |
| Repository imported into another module   | Hidden coupling     | Use injected service instead      |
| Direct database query in a use case       | Persistence leak    | Use repository                    |
| Shared package imports `NestJS`           | Framework coupling  | Keep domain pure                  |
| `export *` in shared package `index.ts`   | Unclear public API  | Explicit exports only             |
| Module-to-module import outside DI        | Tight coupling      | Inject service instead            |
| `pnpm dev` doesn't start both servers     | Setup issue         | Check turbo.json tasks            |

---

## Getting Help

1. **Can't find what you're looking for?** → Check [INDEX.md](INDEX.md) for the navigation guide
2. **Need visual representations?** → Read [DIAGRAMS.md](DIAGRAMS.md)
3. **Verifying setup is correct?** → Use [CHECKLIST.md](CHECKLIST.md)
4. **Quick reference needed?** → Check [SUMMARY.md](SUMMARY.md)
5. **Confused about imports?** → Read [conventions.md - Import Rules](conventions.md#import-rules)
6. **Need implementation example?** → See [structure.md - Example: Player Module Persistence](structure.md#example-player-module-persistence)

---

## Next Steps

### For Backend Engineer

1. Read [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) (**required**)
2. Read [conventions.md - Database Integration Rules](conventions.md#database-integration-rules) (**required**)
3. Implement first module following the pattern
4. Verify with [CHECKLIST.md - Phase 6](CHECKLIST.md#phase-6-backend-module-structure)

### For Database Architect

1. Read [structure.md - Example: Player Module Persistence](structure.md#example-player-module-persistence) (**required**)
2. Map schema to aggregates using [SUMMARY.md - Database Mapping](SUMMARY.md#database-mapping-quick-reference)
3. Coordinate with backend engineer on mapper implementation
4. Verify schema with [CHECKLIST.md - Phase 6](CHECKLIST.md#phase-6-backend-module-structure)

### For Frontend Engineer

1. Read [conventions.md - Frontend Component Organization](conventions.md#frontend-component-organization) (**required**)
2. Start building with `pnpm dev`
3. Consume contracts from `@netwatch/contracts`
4. Reference [DIAGRAMS.md - Event Flow](DIAGRAMS.md#6-real-time-event-flow-websocket) for WebSocket integration

### For Everyone

1. Run `pnpm build` to verify setup
2. Read [README.md](README.md) for your role
3. Reference this documentation as needed
4. Ask before adding code that breaks the structure

---

## Document Map

| Document                                         | Length | Purpose                         | Audience             |
| ------------------------------------------------ | ------ | ------------------------------- | -------------------- |
| **START-HERE.md** (you are here)                 | 5 min  | Entry point, navigation         | Everyone             |
| [README.md](README.md)                           | 5 min  | Quick start per role            | All roles            |
| [SUMMARY.md](SUMMARY.md)                         | 10 min | One-page overview               | All roles            |
| [INDEX.md](INDEX.md)                             | 5 min  | Document navigation guide       | All roles            |
| [structure.md](structure.md)                     | 20 min | Folder layout, persistence      | Backend, Database    |
| [turborepo-pipelines.md](turborepo-pipelines.md) | 15 min | Build tasks, local workflow     | All roles            |
| [conventions.md](conventions.md)                 | 20 min | Naming, imports, database rules | All roles            |
| [DIAGRAMS.md](DIAGRAMS.md)                       | 15 min | Visual flowcharts               | All roles            |
| [CHECKLIST.md](CHECKLIST.md)                     | 30 min | Implementation verification     | Implementation phase |

---

## Monorepo Status

- ✅ **Design Complete:** Structure defined, rules documented
- ✅ **Backend Unblocked:** Repositories, persistence, modules clear
- ✅ **Database Unblocked:** Mapping rules, schema coordination clear
- ✅ **Frontend Ready:** Contracts, events, imports defined
- ✅ **Documentation Complete:** 8 comprehensive guides
- ⏳ **Implementation:** Ready to begin

---

## Quick Command Reference

```bash
# Setup
pnpm install            # Install all packages

# Development
pnpm dev                # Start backend + frontend dev servers
pnpm test:watch         # Run tests in watch mode

# Building
pnpm build              # Compile all packages
pnpm clean              # Remove artifacts

# Quality
pnpm lint               # Check code style
pnpm lint:fix           # Auto-fix code style
pnpm type-check         # Check TypeScript types
pnpm test               # Run all tests

# Advanced
turbo run build --scope=@netwatch/domain
                        # Build only domain package
turbo run build --graph # Show build dependency graph
```

---

## Contact & Questions

- **Monorepo structure:** See [structure.md](structure.md)
- **Backend specifics:** See [conventions.md - Database Integration Rules](conventions.md#database-integration-rules)
- **Build issues:** See [turborepo-pipelines.md](turborepo-pipelines.md)
- **Verification:** See [CHECKLIST.md](CHECKLIST.md)

---

**Status:** Ready for implementation. Backend and database are unblocked. Frontend can proceed in parallel. Build and test locally with `pnpm dev` + `pnpm test:watch`.

**Last Updated:** January 22, 2026

**Next:** Read [README.md](README.md) for your role, or [SUMMARY.md](SUMMARY.md) for one-page overview.
