# Monorepo Documentation Index

Quick guide to find the information you need based on your role.

---

## For Backend Engineer 🔧

**Start here:** [README.md](README.md) → "For Backend Engineer" section

**Essential readings:**

1. [structure.md - Persistence Layer Location](structure.md#persistence-layer-location)
   - Where repositories live
   - How mappers work
   - Database-to-domain mapping

2. [conventions.md - Database Integration Rules](conventions.md#database-integration-rules)
   - Repository location and responsibility
   - Mapper patterns
   - Use case → repository → database flow

3. [structure.md - Backend Module Structure](structure.md#backend-module-structure)
   - Folder organization
   - What can depend on what
   - Isolation rules

4. [conventions.md - Database Integration Rules](conventions.md#database-integration-rules)
   - Exactly where to put persistence code
   - How to structure repositories
   - Mapper patterns

**Reference:**

- [turborepo-pipelines.md](turborepo-pipelines.md) — How to build, test, and develop locally
- [conventions.md - File Names](conventions.md#file-names) — Naming conventions for your files
- [CHECKLIST.md - Phase 6: Backend Module Structure](CHECKLIST.md#phase-6-backend-module-structure) — Verification checklist for your module

**Quick commands:**

```bash
pnpm dev              # Start backend dev server
pnpm test:watch       # Run tests as you develop
pnpm test:e2e         # Run API tests
pnpm build            # Compile backend
```

---

## For Database Architect 🗄️

**Start here:** [README.md](README.md) → "For Database Architect" section

**Essential readings:**

1. [structure.md - Persistence Layer Location](structure.md#persistence-layer-location)
   - Example: Player Module Persistence
   - How backend maps tables to aggregates
   - Mapper responsibility

2. [conventions.md - Database Mapping Rule](conventions.md#database-mapping-rule)
   - One table per Aggregate Root
   - Mapping table
   - Mapper patterns that reconstruct aggregates

3. [structure.md - Backend Module Structure](structure.md#backend-module-structure)
   - Where persistence code lives
   - How modules organize domain logic
   - What invariants the database enforces

4. [SUMMARY.md - Database Mapping Quick Reference](SUMMARY.md#database-mapping-quick-reference)
   - Tables and their aggregate roots
   - Quick reference for mapping decisions

**Reference:**

- `/docs/software-architect/domain-model.md` — The domain entities and aggregates
- `/docs/database-architect/schema-design.md` — The current PostgreSQL schema
- [CHECKLIST.md - Phase 5](CHECKLIST.md#phase-5-backend-module-structure) — Verification checklist for database setup

**Coordination:**

- Work with backend engineer to map aggregates to tables
- Define invariants at database level
- Validate that mappers reconstruct correctly

---

## For Frontend Engineer 🎨

**Start here:** [README.md](README.md) → "For Frontend Engineer" section

**Essential readings:**

1. [conventions.md - Frontend Component Organization](conventions.md#frontend-component-organization)
   - Where to put components, hooks, utils
   - Component naming
   - Path aliases

2. [structure.md - App-Specific `frontend` Package](structure.md#appsfrontend)
   - What frontend can depend on
   - What frontend cannot depend on
   - WebSocket and HTTP integration

3. [conventions.md - Import Rules → Frontend Import Rules](conventions.md#frontend-import-rules)
   - What you can import
   - What you cannot import
   - Examples

4. [conventions.md - Real-Time Event Integration](conventions.md#real-time-event-integration)
   - How to subscribe to WebSocket events
   - Event types in `@netwatch/contracts`
   - Example hook for game state

**Reference:**

- [turborepo-pipelines.md](turborepo-pipelines.md) — How to build and test locally
- [conventions.md - File Naming](conventions.md#file-names) — Component naming
- [structure.md - Dependency Graph](structure.md#dependency-graph) — What you can and cannot import

**Quick commands:**

```bash
pnpm dev              # Start Next.js dev server
pnpm test:watch       # Run component tests as you develop
pnpm build            # Build for production
```

---

## For Any Developer 👨‍💻

**When you need to...**

### ...understand the folder structure

Read [structure.md](structure.md)

- Visual overview of `apps/`, `packages/`
- Package responsibilities
- Dependency graph (what imports what)

### ...set up the monorepo locally

Read [turborepo-pipelines.md](turborepo-pipelines.md)

- Local development workflow
- Quick command reference
- Debugging and filtering

### ...follow naming conventions

Read [conventions.md - Naming Conventions](conventions.md#naming-conventions)

- Package names
- Folder names
- File names (entities, services, hooks, etc.)
- Database table/column names

### ...import from another package

Read [conventions.md - Import Rules](conventions.md#import-rules)

- What you can import
- What you cannot import
- How to use barrel exports

### ...add new shared code

Read [conventions.md - Shared Code Rules](conventions.md#shared-code-rules)

- When to share code
- Code review checklist
- Public API via `index.ts`

### ...implement a feature

1. [structure.md - Backend Module Structure](structure.md#backend-module-structure) (backend)
   OR [conventions.md - Frontend Component Organization](conventions.md#frontend-component-organization) (frontend)
2. [conventions.md - Naming Conventions](conventions.md#naming-conventions)
3. [turborepo-pipelines.md - Local Development Workflow](turborepo-pipelines.md#local-development-workflow)

### ...debug something

[turborepo-pipelines.md - Turborepo CLI Commands Reference](turborepo-pipelines.md#turborepo-cli-commands-reference)

- Show task execution order
- Generate dependency graph
- Run specific packages

### ...verify the monorepo is correct

Read [CHECKLIST.md](CHECKLIST.md)

- Phase-by-phase verification
- Red flags to watch for
- Success criteria

### ...get a quick overview

Read [SUMMARY.md](SUMMARY.md)

- One-page architecture overview
- Dependency flow diagram
- Key decisions and rationale
- File naming quick reference

---

## Document Overview

| Document                                         | Purpose                                   | Audience          | Read Time |
| ------------------------------------------------ | ----------------------------------------- | ----------------- | --------- |
| [README.md](README.md)                           | Quick start guide per role                | All               | 5 min     |
| [SUMMARY.md](SUMMARY.md)                         | One-page architecture overview            | All               | 10 min    |
| [structure.md](structure.md)                     | Folder layout, packages, persistence      | Backend, Database | 20 min    |
| [turborepo-pipelines.md](turborepo-pipelines.md) | Build tasks, local workflow               | All               | 15 min    |
| [conventions.md](conventions.md)                 | Naming, imports, database rules           | All               | 20 min    |
| [CHECKLIST.md](CHECKLIST.md)                     | Verification and implementation checklist | All               | 30 min    |
| **This file**                                    | Navigation guide                          | All               | 5 min     |

**Total reading time:** ~60 minutes for complete understanding.

---

## Quick Links by Common Questions

**"Where do I put X?"**

- Repository → [structure.md - Persistence Layer Location](structure.md#persistence-layer-location)
- Component → [conventions.md - Frontend Component Organization](conventions.md#frontend-component-organization)
- Module → [structure.md - Backend Module Structure](structure.md#backend-module-structure)
- Shared code → [conventions.md - Shared Code Rules](conventions.md#shared-code-rules)
- Domain model → [SUMMARY.md - Database Mapping](SUMMARY.md#database-mapping-quick-reference)

**"Can I import X from Y?"**

- [conventions.md - Import Rules](conventions.md#import-rules) has full rules
- [SUMMARY.md - Import Rules at a Glance](SUMMARY.md#import-rules-at-a-glance) for quick answer

**"How do I name this file?"**

- [conventions.md - Naming Conventions](conventions.md#naming-conventions)
- [SUMMARY.md - File Naming Quick Reference](SUMMARY.md#file-naming-quick-reference)

**"How do I run X?"**

- [turborepo-pipelines.md - Task Definitions by Scope](turborepo-pipelines.md#task-definitions-by-scope)
- [SUMMARY.md - Turborepo Task Reference](SUMMARY.md#turborepo-task-reference)

**"Is the monorepo set up correctly?"**

- [CHECKLIST.md](CHECKLIST.md) — Follow the phases to verify

**"What can the database architect do now?"**

- [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) defines the contract

---

## Document Tree (for reference)

```
docs/monorepo-architect/
├── README.md              (Quick start per role)
├── SUMMARY.md             (One-page overview)
├── INDEX.md               (This file - navigation)
├── CHECKLIST.md           (Implementation verification)
├── structure.md           (Folder layout, packages, persistence)
├── turborepo-pipelines.md (Build tasks, local workflow)
└── conventions.md         (Naming, imports, database rules)
```

---

## How to Use This Index

1. **Find your role** (Backend, Database, Frontend, or Any)
2. **Follow the "Start here" link**
3. **Read the "Essential readings" in order**
4. **Reference the specific sections as needed**
5. **Check the "Quick Links" section when in doubt**

If you can't find what you're looking for, use this index to navigate. If the index doesn't have your question, the monorepo design is incomplete.

---

## Version

- Created: January 22, 2026
- Last Updated: January 22, 2026
- Status: Active (used for all development)

---

**Need help?** Read [README.md](README.md) for role-specific guidance, then reference this index to find the section you need.
