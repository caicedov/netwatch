# Getting Started with NetWatch Monorepo

Welcome! This guide will help you set up the development environment.

## Prerequisites

Ensure you have:

- **Node.js:** >=18.0.0
- **pnpm:** >=8.0.0 (install with `npm install -g pnpm`)
- **Git:** For version control

## Installation

### 1. Install Dependencies

```bash
pnpm install
```

This will:

- Install all workspace dependencies
- Link local packages together
- Set up development tools

### 2. Verify Setup

```bash
pnpm build
```

This will compile all packages and apps. If successful, you're ready to develop!

### 3. Start Development

**Open two terminals:**

**Terminal 1 — Development servers:**

```bash
pnpm dev
```

This will start:

- Backend on `http://localhost:3000`
- Frontend on `http://localhost:3001`

**Terminal 2 — Tests (optional):**

```bash
pnpm test:watch
```

This will run tests in watch mode as you develop.

## Project Structure

```
apps/
├── backend/          NestJS modular monolith
└── frontend/         Next.js with React

packages/
├── domain/          Pure domain models
├── contracts/       API and event schemas
├── config/          Shared tooling config
└── tsconfig/        TypeScript base configs

docs/monorepo-architect/
├── START-HERE.md              Entry point
├── structure.md               Folder layout & persistence rules
├── turborepo-pipelines.md     Build tasks & workflow
└── conventions.md             Naming & import rules
```

## Common Commands

| Command           | Purpose                              |
| ----------------- | ------------------------------------ |
| `pnpm dev`        | Start backend + frontend dev servers |
| `pnpm build`      | Compile all packages                 |
| `pnpm test`       | Run all tests                        |
| `pnpm test:watch` | Run tests in watch mode              |
| `pnpm test:e2e`   | Run E2E tests (backend only)         |
| `pnpm lint`       | Check code style                     |
| `pnpm lint:fix`   | Auto-fix code style                  |
| `pnpm type-check` | Check TypeScript types               |
| `pnpm clean`      | Remove artifacts and cache           |

## What to Read Next

Based on your role:

### 👨‍💻 Backend Engineer

Read in order:

1. [docs/monorepo-architect/START-HERE.md](docs/monorepo-architect/START-HERE.md) — Overview
2. [docs/monorepo-architect/structure.md](docs/monorepo-architect/structure.md) — Persistence layer rules
3. [docs/monorepo-architect/conventions.md](docs/monorepo-architect/conventions.md) — Database rules

**Start implementing:** `apps/backend/src/modules/`

### 🎨 Frontend Engineer

Read in order:

1. [docs/monorepo-architect/START-HERE.md](docs/monorepo-architect/START-HERE.md) — Overview
2. [docs/monorepo-architect/conventions.md](docs/monorepo-architect/conventions.md) — Component organization
3. [docs/monorepo-architect/DIAGRAMS.md](docs/monorepo-architect/DIAGRAMS.md) — Event flow

**Start implementing:** `apps/frontend/src/components/`

### 🗄️ Database Architect

Read in order:

1. [docs/monorepo-architect/START-HERE.md](docs/monorepo-architect/START-HERE.md) — Overview
2. [docs/monorepo-architect/structure.md](docs/monorepo-architect/structure.md) — Persistence layer
3. [docs/monorepo-architect/SUMMARY.md](docs/monorepo-architect/SUMMARY.md) — Database mapping

### 📊 New to the Project

1. Read [docs/monorepo-architect/START-HERE.md](docs/monorepo-architect/START-HERE.md)
2. Read [docs/monorepo-architect/SUMMARY.md](docs/monorepo-architect/SUMMARY.md) (one-page overview)
3. Explore the documentation as needed

## Troubleshooting

### `pnpm install` fails

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### `pnpm dev` doesn't start

```bash
# Check that packages are built
pnpm build

# Then try dev again
pnpm dev
```

### Type errors after changes

```bash
# Rebuild everything
pnpm clean
pnpm build
pnpm type-check
```

### Tests fail

```bash
# Ensure dependencies are installed
pnpm install

# Run tests with verbose output
pnpm test -- --verbose
```

## Directory You'll Work In

### Backend

```
apps/backend/src/modules/
├── <feature-name>/
│   ├── domain/              Pure domain logic
│   ├── application/         Use cases
│   ├── infrastructure/      Repositories, mappers
│   ├── presentation/        Controllers
│   └── <feature>.module.ts
```

### Frontend

```
apps/frontend/src/
├── components/              React components
├── hooks/                   Custom hooks
├── lib/                     Utilities
├── store/                   State management
└── app/                     Route segments
```

### Shared

```
packages/domain/src/
├── entities/                Domain entities
├── value-objects/           Value objects
├── aggregates/              Aggregate roots
└── index.ts                 Public API

packages/contracts/src/
├── api/                     HTTP DTOs
└── events/                  WebSocket events
```

## Key Principles

1. **Unidirectional imports:** Apps depend on Shared, never the reverse
2. **No app-to-app imports:** Frontend ↔ Backend (no circular)
3. **Pure domain:** No framework, no database, no HTTP
4. **Shared is intentional:** Only types and contracts
5. **Repositories are private:** To their module, injected via DI

## Getting Help

1. **Can't find something?** → Check [docs/monorepo-architect/INDEX.md](docs/monorepo-architect/INDEX.md)
2. **Need a visual?** → Read [docs/monorepo-architect/DIAGRAMS.md](docs/monorepo-architect/DIAGRAMS.md)
3. **Implementing a feature?** → Reference [docs/monorepo-architect/CHECKLIST.md](docs/monorepo-architect/CHECKLIST.md)
4. **Quick reference?** → See [docs/monorepo-architect/SUMMARY.md](docs/monorepo-architect/SUMMARY.md)

## Next Steps

1. ✅ Install dependencies: `pnpm install`
2. ✅ Start developing: `pnpm dev`
3. ✅ Read role-specific docs
4. ✅ Start implementing features

**Happy coding!** 🚀

---

For complete documentation, see `/docs/monorepo-architect/START-HERE.md`
