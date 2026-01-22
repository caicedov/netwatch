# Turborepo Pipelines

## Overview

Turborepo orchestrates **build**, **dev**, **test**, and **lint** tasks across all packages and apps. Pipelines are explicit, minimal, and optimized for single-developer iteration speed.

**Core principle:** Shared packages build before apps. Development tasks are not cached. Tests depend on build artifacts.

---

## Task Dependency Graph

```
Legend:
  → requires (depends on)
  ⟶ can cache
  ⊙ root task

┌─────────────────────────────────────────────────┐
│ Lifecycle: clean → build → test → lint          │
└─────────────────────────────────────────────────┘

SHARED PACKAGES:
  @netwatch/tsconfig   (no dependencies)
  @netwatch/config     (no dependencies)
  @netwatch/domain     → @netwatch/tsconfig
  @netwatch/contracts  → @netwatch/tsconfig, @netwatch/domain

APPS:
  apps/backend         → @netwatch/domain, @netwatch/contracts, @netwatch/tsconfig
  apps/frontend        → @netwatch/domain, @netwatch/contracts, @netwatch/tsconfig

TEST:
  @netwatch/domain/test       → @netwatch/domain (build)
  @netwatch/contracts/test    → @netwatch/contracts (build)
  apps/backend/test          → apps/backend (build)
  apps/frontend/test         → apps/frontend (build)

LINT:
  @netwatch/* (lint)    → no dependencies (parallel)
  apps/*  (lint)        → no dependencies (parallel)
```

---

## `turbo.json` Configuration

Save this as **`turbo.json`** in the **root of the monorepo**.

```json
{
  "$schema": "https://turborepo.org/schema.json",
  "version": "2",
  "globalDependencies": [
    "tsconfig.json",
    ".biomerc.json",
    "pnpm-workspace.yaml"
  ],
  "tasks": {
    "build": {
      "description": "Compile TypeScript, generate dist/",
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true,
      "hashAlgorithm": "md5",
      "env": ["NODE_ENV"]
    },

    "dev": {
      "description": "Start dev server (watch mode)",
      "cache": false,
      "persistent": true,
      "env": ["NODE_ENV"]
    },

    "test": {
      "description": "Run unit and integration tests",
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true,
      "inputs": ["src/**", "test/**", "jest.config.js"]
    },

    "test:watch": {
      "description": "Run tests in watch mode (CI-like, for local validation)",
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    },

    "test:e2e": {
      "description": "Run end-to-end tests (backend only)",
      "dependsOn": ["build"],
      "cache": false,
      "env": ["NODE_ENV", "DATABASE_URL", "JWT_SECRET"]
    },

    "lint": {
      "description": "Lint and format check with Biome",
      "cache": true,
      "inputs": ["src/**", ".biomerc.json"],
      "outputs": []
    },

    "lint:fix": {
      "description": "Fix linting issues automatically",
      "cache": false,
      "inputs": ["src/**", ".biomerc.json"]
    },

    "type-check": {
      "description": "Run TypeScript type checking without emit",
      "dependsOn": ["^build"],
      "cache": true,
      "outputs": []
    },

    "clean": {
      "description": "Remove dist/, coverage/, node_modules/.turborepo",
      "cache": false
    }
  },
  "ui": "tui",
  "outputLogs": "new-only"
}
```

---

## Task Definitions by Scope

### Root-Level Tasks (Run from monorepo root)

#### `pnpm build`

Builds all packages and apps in dependency order.

**What it does:**

1. Build shared packages first: `@netwatch/tsconfig`, `@netwatch/config`
2. Build domain/contracts packages
3. Build apps (backend, frontend)
4. Generate `dist/` directories for each package

**Dependency chain:**

```
@netwatch/tsconfig
         ↓
@netwatch/config
         ↓
@netwatch/domain
         ↓
@netwatch/contracts
         ↓
apps/backend, apps/frontend
```

**Output:** All packages have `dist/` and are ready for deployment or further testing.

**Cache:** ✓ Cached (only rebuild if source files changed)

---

#### `pnpm dev`

Start all dev servers in watch mode (backend, frontend, potentially others).

**What it does:**

1. Backend: Watch mode with hot reload (NestJS)
2. Frontend: Next.js dev server with hot reload
3. All running in parallel

**Output:**

- Backend: Running on `http://localhost:3000` (or configured port)
- Frontend: Running on `http://localhost:3001` (or configured port)

**Cache:** ✗ Not cached (persistent, watch-based)

**Single-developer workflow:**

```bash
pnpm dev
# Both servers start in foreground
# Any file change triggers rebuild
# Ctrl+C to stop all
```

---

#### `pnpm test`

Run all tests (unit + integration) across packages and apps.

**What it does:**

1. Ensure all packages are built
2. Run Jest/Vitest in each package
3. Collect coverage reports
4. Exit with non-zero if any test fails

**Scope:**

- `packages/*/test/` (domain, contracts, etc.)
- `apps/*/test/` (backend modules, frontend components)

**Output:**

- Exit code 0 if all tests pass
- Coverage reports in `coverage/`
- Failed tests printed to stderr

**Cache:** ✓ Cached (by source files + test files)

**When to run:** Before committing, as part of pre-commit hook.

---

#### `pnpm test:watch`

Run tests in watch mode during development.

**What it does:**

- Same as `test`, but watches for file changes
- Re-runs only affected tests
- Never exits (until Ctrl+C)

**Cache:** ✗ Not cached

**Single-developer workflow:**

```bash
pnpm test:watch
# Test runs, watches for changes
# Any test file or source change re-runs tests
# Great for TDD
```

---

#### `pnpm test:e2e`

Run end-to-end tests (backend API + WebSocket, if applicable).

**What it does:**

1. Build backend
2. Start test database (PostgreSQL in Docker or test instance)
3. Run E2E test suite (Jest with `@nestjs/testing`)
4. Validate HTTP routes, WebSocket events, real-time behavior

**Output:** Test results, logs, database state

**Cache:** ✗ Not cached (stateful, real database involved)

**Prerequisites:**

- Docker (for test database) or PostgreSQL running
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, etc.

**When to run:** After changes to API contracts or before deployment.

---

#### `pnpm lint`

Lint and format-check all files.

**What it does:**

1. Run Biome (or ESLint) on all `src/` directories
2. Check formatting (spaces, semicolons, imports)
3. Check linting rules (no unused variables, etc.)
4. Exit with non-zero if any violations found

**Output:** List of violations and suggested fixes

**Cache:** ✓ Cached

**Single-developer workflow:**

```bash
pnpm lint        # Check for violations (non-destructive)
pnpm lint:fix    # Auto-fix violations
```

---

#### `pnpm lint:fix`

Auto-fix linting and formatting issues.

**What it does:**

1. Run Biome with `--fix` flag
2. Reformat all files
3. Fix auto-fixable violations (unused imports, semicolons, etc.)
4. Require manual fixes for others (type errors, logical issues)

**Output:** Modified files

**Cache:** ✗ Not cached (modifies files)

---

#### `pnpm type-check`

Run TypeScript type checking without code generation.

**What it does:**

1. Parse all TypeScript files
2. Resolve types across packages
3. Report type errors
4. Do **not** emit JavaScript

**Use case:** Quick validation during development or in pre-commit hooks.

**Output:** Type errors to stderr

**Cache:** ✓ Cached

---

#### `pnpm clean`

Remove generated artifacts.

**What it does:**

1. Remove all `dist/` directories
2. Remove `coverage/` directories
3. Remove Turborepo cache (`.turborepo/`)
4. Keep `node_modules/` (use `pnpm install` to restore if needed)

**When to run:** After major dependency changes, after failed builds, or to start fresh.

---

### Package-Level Tasks

Each package in `packages/` and each app in `apps/` has its own `package.json` with scripts. Turborepo coordinates them.

#### Example: `packages/domain/package.json`

```json
{
  "name": "@netwatch/domain",
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "biome lint src/",
    "lint:fix": "biome lint src/ --fix"
  }
}
```

#### Example: `apps/backend/package.json`

```json
{
  "name": "backend",
  "scripts": {
    "build": "nest build",
    "start": "node dist/main.js",
    "dev": "nest start --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "biome lint src/",
    "lint:fix": "biome lint src/ --fix"
  }
}
```

---

## Caching Strategy

### What Is Cached?

- **Build artifacts** (`dist/`)
- **Test results** (if tests don't depend on external state)
- **Lint results**
- **Type-check results**

### What Is Not Cached?

- **Dev tasks** (persistent, watch-based)
- **E2E tests** (depend on test database state)
- **Format fixes** (modifies files)

### Cache Invalidation

Turborepo automatically invalidates cache when:

- Source files change
- Dependencies change
- `turbo.json` changes
- Env vars change (if declared in task)

**Manual invalidation:**

```bash
pnpm clean              # Remove all cache
turbo cache clean       # Remove only Turborepo cache
```

---

## Local Development Workflow

### First Time Setup

```bash
# Clone repo
git clone <repo>
cd netwatch

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests to validate setup
pnpm test
```

### Daily Development

```bash
# Start dev servers (all in parallel)
pnpm dev

# In another terminal: run tests in watch mode
pnpm test:watch

# Before committing: lint and format
pnpm lint:fix
pnpm test

# After pulling changes: rebuild affected packages
pnpm build
```

### Before Committing

```bash
# Lint and fix
pnpm lint:fix

# Type-check
pnpm type-check

# Run tests
pnpm test

# For backend changes, run E2E
pnpm test:e2e
```

### After Major Changes

```bash
# Clean cache, rebuild, test
pnpm clean
pnpm build
pnpm test
```

---

## CI/CD Integration (Future)

When setting up CI (GitHub Actions, etc.), reuse these tasks:

```yaml
# Example: .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: "pnpm"

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm build
      - run: pnpm test
      - run: pnpm test:e2e
```

---

## Turborepo CLI Commands Reference

### Build and Test

```bash
# Build all affected packages
turbo run build

# Build specific package
turbo run build --scope=@netwatch/domain

# Build and affected packages only
turbo run build --filter=[HEAD]

# Build with verbose output
turbo run build --verbose

# Build and stream output in real-time
turbo run build --stream
```

### Debugging

```bash
# Show task execution order
turbo run build --graph

# Generate graph as PNG
turbo run build --graph=output.png

# Print cache info
turbo cache status
```

### Filtering

```bash
# Run tasks only on changed packages (since last commit)
turbo run build --filter='...[HEAD]'

# Run tasks on package and dependencies
turbo run build --filter=@netwatch/domain

# Run tasks except a package
turbo run build --filter='!@netwatch/domain'
```

---

## Summary

| Task         | Cached | Persistent | Dependencies | Use Case                      |
| ------------ | ------ | ---------- | ------------ | ----------------------------- |
| `build`      | ✓      | ✗          | `^build`     | Compile code, generate dist/  |
| `dev`        | ✗      | ✓          | None         | Local development, hot reload |
| `test`       | ✓      | ✗          | `build`      | CI validation, pre-commit     |
| `test:watch` | ✗      | ✓          | `build`      | TDD, local testing            |
| `test:e2e`   | ✗      | ✗          | `build`      | Backend API validation        |
| `lint`       | ✓      | ✗          | None         | Code quality checks           |
| `lint:fix`   | ✗      | ✗          | None         | Auto-format code              |
| `type-check` | ✓      | ✗          | `^build`     | Quick type validation         |
| `clean`      | N/A    | ✗          | None         | Reset cache and artifacts     |

**For a single developer:** Focus on `pnpm dev` + `pnpm test:watch` for fast iteration, then `pnpm build && pnpm test && pnpm lint:fix` before committing.
