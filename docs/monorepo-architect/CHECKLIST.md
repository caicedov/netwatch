# Implementation Checklist

This checklist helps verify that the monorepo structure is properly implemented and unblocks backend and database implementation.

---

## Phase 1: Root-Level Setup

- [ ] `turbo.json` exists at monorepo root
- [ ] `pnpm-workspace.yaml` defines workspace paths
- [ ] Root `package.json` has shared scripts:
  - [ ] `"build": "turbo run build"`
  - [ ] `"dev": "turbo run dev"`
  - [ ] `"test": "turbo run test"`
  - [ ] `"lint": "turbo run lint"`
  - [ ] `"lint:fix": "turbo run lint:fix"`
- [ ] Root `tsconfig.json` extends `@netwatch/tsconfig/base.json`
- [ ] Root `.biomerc.json` exists (or `eslint.config.js`)
- [ ] `.gitignore` includes:
  - [ ] `node_modules/`
  - [ ] `dist/`
  - [ ] `coverage/`
  - [ ] `.turborepo/`

---

## Phase 2: Folder Structure

### Apps

- [ ] `apps/backend/` folder exists
- [ ] `apps/backend/src/modules/` folder exists
- [ ] `apps/backend/src/infrastructure/` folder exists
- [ ] `apps/backend/package.json` exists with name: `"backend"`
- [ ] `apps/frontend/` folder exists
- [ ] `apps/frontend/src/app/` folder exists (Next.js App Router)
- [ ] `apps/frontend/src/components/` folder exists
- [ ] `apps/frontend/src/hooks/` folder exists
- [ ] `apps/frontend/package.json` exists with name: `"frontend"`

### Shared Packages

- [ ] `packages/domain/` folder exists
- [ ] `packages/domain/src/entities/` folder exists
- [ ] `packages/domain/src/value-objects/` folder exists
- [ ] `packages/domain/src/aggregates/` folder exists
- [ ] `packages/domain/src/index.ts` exists (barrel export)
- [ ] `packages/domain/package.json` exists with name: `"@netwatch/domain"`

- [ ] `packages/contracts/` folder exists
- [ ] `packages/contracts/src/api/` folder exists
- [ ] `packages/contracts/src/events/` folder exists
- [ ] `packages/contracts/src/index.ts` exists (barrel export)
- [ ] `packages/contracts/package.json` exists with name: `"@netwatch/contracts"`

- [ ] `packages/config/` folder exists
- [ ] `packages/config/` contains `biome.json` (or other shared configs)
- [ ] `packages/config/package.json` exists with name: `"@netwatch/config"`

- [ ] `packages/tsconfig/` folder exists
- [ ] `packages/tsconfig/base.json` exists
- [ ] `packages/tsconfig/react.json` exists
- [ ] `packages/tsconfig/package.json` exists with name: `"@netwatch/tsconfig"`

### Documentation

- [ ] `docs/monorepo-architect/` folder exists
- [ ] `docs/monorepo-architect/structure.md` exists
- [ ] `docs/monorepo-architect/turborepo-pipelines.md` exists
- [ ] `docs/monorepo-architect/conventions.md` exists
- [ ] `docs/monorepo-architect/README.md` exists (quick start)
- [ ] `docs/monorepo-architect/SUMMARY.md` exists (one-page overview)

---

## Phase 3: Dependency Configuration

### Root `package.json`

- [ ] Has `pnpm` workspace definition (in `pnpm-workspace.yaml` or `"workspaces"` field)
- [ ] All packages are listed as `"workspaces"`

### App `package.json`

#### Backend

- [ ] Depends on `"@netwatch/domain"`
- [ ] Depends on `"@netwatch/contracts"`
- [ ] Depends on `"@netwatch/tsconfig"`
- [ ] Does NOT depend on `"@netwatch/config"` (config is dev-only)
- [ ] Does NOT depend on `"frontend"`

#### Frontend

- [ ] Depends on `"@netwatch/domain"`
- [ ] Depends on `"@netwatch/contracts"`
- [ ] Depends on `"@netwatch/tsconfig"`
- [ ] Does NOT depend on `"@netwatch/config"` (config is dev-only)
- [ ] Does NOT depend on `"backend"`

### Shared Package `package.json`

#### Domain

- [ ] Depends on `"@netwatch/tsconfig"` (dev-only)
- [ ] Does NOT depend on any framework (NestJS, React, etc.)
- [ ] Does NOT depend on database libraries
- [ ] Does NOT depend on HTTP libraries
- [ ] Does NOT depend on other packages except tsconfig

#### Contracts

- [ ] Depends on `"@netwatch/domain"` (for type compatibility)
- [ ] Depends on `"@netwatch/tsconfig"` (dev-only)
- [ ] Does NOT depend on any framework
- [ ] Does NOT depend on infrastructure code

#### Config

- [ ] Only contains configuration files (no source code)
- [ ] No dependencies beyond tooling packages (biome, eslint, etc.)

#### TypeScript

- [ ] Only contains configuration files (no source code)
- [ ] No dependencies

---

## Phase 4: TypeScript Configuration

### Root `tsconfig.json`

- [ ] `"extends": "@netwatch/tsconfig/base.json"`
- [ ] `"compilerOptions.baseUrl": "."`
- [ ] `"compilerOptions.paths"` includes:
  - [ ] `"@netwatch/*": ["packages/*/src"]`

### Backend `tsconfig.json`

- [ ] `"extends": "@netwatch/tsconfig/base.json"`
- [ ] `"compilerOptions.outDir": "./dist"`
- [ ] `"compilerOptions.rootDir": "./src"`
- [ ] `"include"` includes `["src/**/*"]`
- [ ] `"exclude"` includes `["node_modules", "dist", "test"]`

### Frontend `tsconfig.json`

- [ ] `"extends": "@netwatch/tsconfig/react.json"`
- [ ] `"compilerOptions.baseUrl": "./src"`
- [ ] `"compilerOptions.paths"` includes:
  - [ ] `"@/*": ["./*"]`

### Shared Package `tsconfig.json`

- [ ] `"extends": "@netwatch/tsconfig/base.json"`
- [ ] `"compilerOptions.outDir": "./dist"`
- [ ] `"compilerOptions.rootDir": "./src"`

---

## Phase 5: Turborepo Configuration

### `turbo.json`

- [ ] File exists at monorepo root
- [ ] Defines tasks:
  - [ ] `"build"` with `"dependsOn": ["^build"]`
  - [ ] `"dev"` with `"cache": false` and `"persistent": true`
  - [ ] `"test"` with `"dependsOn": ["build"]`
  - [ ] `"test:watch"` with `"cache": false`
  - [ ] `"test:e2e"` (backend only)
  - [ ] `"lint"` with caching enabled
  - [ ] `"lint:fix"` with `"cache": false`
  - [ ] `"type-check"` with `"dependsOn": ["^build"]`
  - [ ] `"clean"` with `"cache": false`
- [ ] `"globalDependencies"` includes:
  - [ ] `"tsconfig.json"`
  - [ ] `".biomerc.json"` (or linter config)
  - [ ] `"pnpm-workspace.yaml"`
- [ ] `"ui": "tui"` for better output

### Package `package.json` Scripts

#### Backend

- [ ] `"build": "nest build"`
- [ ] `"dev": "nest start --watch"`
- [ ] `"test": "jest"`
- [ ] `"test:watch": "jest --watch"`
- [ ] `"test:e2e": "jest --config ./test/jest-e2e.json"`
- [ ] `"lint": "biome lint src/"`
- [ ] `"lint:fix": "biome lint src/ --fix"`

#### Frontend

- [ ] `"build": "next build"`
- [ ] `"dev": "next dev"`
- [ ] `"start": "next start"`
- [ ] `"test": "jest"`
- [ ] `"test:watch": "jest --watch"`
- [ ] `"lint": "biome lint src/"`
- [ ] `"lint:fix": "biome lint src/ --fix"`

#### Shared Packages

- [ ] `"build": "tsc --project tsconfig.json"`
- [ ] `"test": "jest"`
- [ ] `"test:watch": "jest --watch"`
- [ ] `"lint": "biome lint src/"`
- [ ] `"lint:fix": "biome lint src/ --fix"`

---

## Phase 6: Backend Module Structure

For each backend module (e.g., `modules/players`):

- [ ] `modules/<domain>/domain/` folder exists
- [ ] `modules/<domain>/application/` folder exists
- [ ] `modules/<domain>/infrastructure/` folder exists
  - [ ] `infrastructure/persistence/` folder exists
  - [ ] `infrastructure/mappers/` folder exists
- [ ] `modules/<domain>/presentation/` folder exists
- [ ] `modules/<domain>/<domain>.module.ts` exists

### Domain Layer Files

- [ ] `domain/<domain>.entity.ts` (entity definition)
- [ ] `domain/<domain>.aggregate.ts` (aggregate root)
- [ ] `domain/*-event.ts` (domain events)
- [ ] NO NestJS imports
- [ ] NO database imports
- [ ] NO HTTP imports
- [ ] NO React imports

### Persistence Files

- [ ] `infrastructure/persistence/<domain>.repository.ts`
  - [ ] Has `async save(aggregate): Promise<void>`
  - [ ] Has `async findById(id): Promise<Aggregate | null>`
  - [ ] Has other query methods as needed
  - [ ] Constructor receives database connection (injected)
  - [ ] NO direct access to repositories from other modules
- [ ] `infrastructure/mappers/<domain>.mapper.ts`
  - [ ] Has `static toDomain(row): Aggregate` method
  - [ ] Has `static toPersistence(aggregate): any` method
  - [ ] Enforces domain invariants during reconstruction

### Application Layer Files

- [ ] `application/<action>-<domain>.usecase.ts` (for each use case)
  - [ ] Constructor receives repositories (injected)
  - [ ] Has `async execute(command): Promise<Result>` method
  - [ ] NO database queries directly
  - [ ] Uses repositories for persistence

### Presentation Layer Files

- [ ] `presentation/<domain>.controller.ts`
  - [ ] Uses NestJS `@Controller()` decorator
  - [ ] Injects use cases via constructor
  - [ ] Routes to use cases
  - [ ] Returns DTOs from `@netwatch/contracts`

### Module File

- [ ] `<domain>.module.ts` exists
  - [ ] Uses `@Module()` decorator
  - [ ] Imports dependencies (database connection, etc.)
  - [ ] Provides services (use cases, repositories)
  - [ ] Exports only public services

---

## Phase 7: Shared Package Implementation

### Domain Package

- [ ] `src/entities/` contains entity classes
  - [ ] No framework imports
  - [ ] Immutable or semi-immutable
  - [ ] Validation in constructor

- [ ] `src/value-objects/` contains value objects
  - [ ] Fully immutable (readonly properties)
  - [ ] No dependencies on anything

- [ ] `src/aggregates/` contains aggregate roots
  - [ ] Represent a coherent unit of domain logic
  - [ ] Contain nested entities and value objects
  - [ ] Can be reconstructed from database rows

- [ ] `src/index.ts` is barrel export
  - [ ] Exports all public entities, value objects, aggregates
  - [ ] No `export *` wildcards

### Contracts Package

- [ ] `src/api/` contains HTTP DTOs
  - [ ] Request types (e.g., `CreatePlayerRequestDto`)
  - [ ] Response types (e.g., `PlayerResponseDto`)
  - [ ] No business logic

- [ ] `src/events/` contains WebSocket event types
  - [ ] Event type definitions
  - [ ] Event payload types
  - [ ] No business logic

- [ ] `src/index.ts` is barrel export
  - [ ] Re-exports from `api/` and `events/`

---

## Phase 8: Import Validation

### Backend Imports

In `apps/backend/src/**/*.ts`:

- [ ] No imports from `apps/frontend`
- [ ] All shared code imported from `@netwatch/*`
- [ ] Domain models only from `@netwatch/domain`
- [ ] Contracts only from `@netwatch/contracts`
- [ ] Cross-module communication via dependency injection
- [ ] Repository imports only in own module's infrastructure layer

### Frontend Imports

In `apps/frontend/src/**/*.ts(x)`:

- [ ] No imports from `apps/backend`
- [ ] All shared code imported from `@netwatch/*`
- [ ] Domain types only from `@netwatch/domain`
- [ ] Contract types only from `@netwatch/contracts`
- [ ] React and Next.js as appropriate

### Shared Package Imports

In `packages/*/src/**/*.ts`:

- [ ] Domain: NO framework imports (NestJS, React, Express, etc.)
- [ ] Domain: NO database imports
- [ ] Domain: NO HTTP imports
- [ ] Contracts: NO business logic
- [ ] Contracts: NO framework-specific decorators
- [ ] All public exports through `index.ts`

---

## Phase 9: Local Development

- [ ] `pnpm install` succeeds without errors
- [ ] `pnpm build` compiles all packages
- [ ] `pnpm dev` starts both backend and frontend dev servers
- [ ] `pnpm test` runs all tests and passes
- [ ] `pnpm test:watch` runs tests in watch mode
- [ ] `pnpm lint` checks code style
- [ ] `pnpm lint:fix` auto-fixes style issues
- [ ] `pnpm type-check` validates TypeScript types

---

## Phase 10: Documentation

- [ ] All documents exist:
  - [ ] `docs/monorepo-architect/README.md` (quick start)
  - [ ] `docs/monorepo-architect/structure.md` (folder layout, persistence rules)
  - [ ] `docs/monorepo-architect/turborepo-pipelines.md` (tasks, caching)
  - [ ] `docs/monorepo-architect/conventions.md` (naming, imports, database rules)
  - [ ] `docs/monorepo-architect/SUMMARY.md` (one-page overview)

- [ ] Backend engineer can read and understand:
  - [ ] Where to put repositories
  - [ ] How to map aggregates to tables
  - [ ] What they can and cannot import

- [ ] Database architect can read and understand:
  - [ ] How to map schemas to modules
  - [ ] What invariants to enforce at the DB level
  - [ ] How backend reconstructs aggregates

- [ ] Frontend engineer can read and understand:
  - [ ] What they can depend on (contracts, domain types)
  - [ ] How to integrate with backend (HTTP, WebSocket)
  - [ ] Component and module organization

---

## Success Criteria

- [ ] ✅ Backend engineer can implement a feature without restructuring folders
- [ ] ✅ Database architect can map schemas without guessing where code lives
- [ ] ✅ Frontend engineer works independently via contracts
- [ ] ✅ `pnpm dev` starts both servers together
- [ ] ✅ Tests run in under 30 seconds (cached)
- [ ] ✅ No circular dependencies exist
- [ ] ✅ No file imports code from both backend and frontend
- [ ] ✅ New developer understands structure in 30 minutes
- [ ] ✅ Persistence layer rules are clear and enforced

---

## Verification Commands

Run these to verify the monorepo is properly set up:

```bash
# Check that all packages can be built
pnpm build

# Check that tests pass
pnpm test

# Check that linting is clean
pnpm lint

# Check that TypeScript types are valid
pnpm type-check

# Check that Turborepo can see the task graph
turbo run build --graph

# Check dependencies are correctly declared
pnpm list --depth=0
```

---

## Red Flags

If you see any of these, the structure is broken:

- 🚩 Backend imports from frontend
- 🚩 Frontend imports from backend
- 🚩 Shared packages import framework code
- 🚩 Domain models have NestJS decorators
- 🚩 Repository classes imported across modules
- 🚩 Direct database queries in use cases
- 🚩 Circular dependency errors
- 🚩 `pnpm dev` doesn't start both servers
- 🚩 Documentation is unclear about where code should go
- 🚩 Developer has to guess about folder structure

---

## Next Steps After Verification

1. Backend engineer implements first module (e.g., `modules/players`)
2. Database architect creates schema based on module structure
3. Frontend engineer consumes contracts and builds UI
4. Iterate on features, maintaining clear boundaries

If any item is unchecked, refer to the relevant documentation section and fix it before proceeding.
