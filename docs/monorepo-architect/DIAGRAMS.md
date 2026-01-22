# Architecture Diagrams & Visual References

Visual representations of the monorepo architecture, dependency flow, and module structure.

---

## 1. High-Level Monorepo Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│                         netwatch Monorepo                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────┐  ┌─────────────────────────┐   │
│  │  apps/                          │  │  packages/              │   │
│  ├─────────────────────────────────┤  ├─────────────────────────┤   │
│  │ ┌──────────────────────────────┐│  │ ┌──────────────────────┐│  │
│  │ │ backend (NestJS)             ││  │ │ domain (Pure TS)     ││  │
│  │ │ - HTTP API                   ││  │ │ - Entities           ││  │
│  │ │ - WebSocket Server           ││  │ │ - Value Objects      ││  │
│  │ │ - Game Logic                 ││  │ │ - Aggregates         ││  │
│  │ │ - Database Persistence       ││  │ │ - Domain Events      ││  │
│  │ └──────────────────────────────┘│  │ └──────────────────────┘│  │
│  │                                  │  │                        │   │
│  │ ┌──────────────────────────────┐│  │ ┌──────────────────────┐│  │
│  │ │ frontend (Next.js + React)   ││  │ │ contracts (APIs)     ││  │
│  │ │ - UI Components              ││  │ │ - HTTP DTOs          ││  │
│  │ │ - Real-time Subscription     ││  │ │ - WebSocket Events   ││  │
│  │ │ - Game State Management      ││  │ │ - Schemas            ││  │
│  │ └──────────────────────────────┘│  │ └──────────────────────┘│  │
│  │                                  │  │                        │   │
│  └─────────────────────────────────┘  │ ┌──────────────────────┐│  │
│                                        │ │ config (Tooling)     ││  │
│                                        │ │ - Biome              ││  │
│                                        │ │ - ESLint             ││  │
│                                        │ └──────────────────────┘│  │
│                                        │                        │   │
│                                        │ ┌──────────────────────┐│  │
│                                        │ │ tsconfig (TS Base)   ││  │
│                                        │ │ - base.json          ││  │
│                                        │ │ - react.json         ││  │
│                                        │ └──────────────────────┘│  │
│                                        │                        │   │
│                                        └─────────────────────────┘  │
│                                                                     │
│  Build: Turborepo + pnpm                                           │
│  Language: TypeScript everywhere                                   │
│  Package Manager: pnpm workspaces                                  │
│                                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Unidirectional Dependency Flow

```
LAYER 0 (Apps)
┌────────────────────────────────────────────┐
│         apps/backend                       │
│         apps/frontend                      │
└────────────────┬─────────────────────────┬─┘
                 │                         │
                 │ depends on              │ depends on
                 │                         │
LAYER 1 (Shared Packages)
┌────────────────┴─────────────────────────┴──────────────────┐
│                                                              │
│  @netwatch/domain    @netwatch/contracts   @netwatch/config │
│                                                              │
│  (Types & Models)    (API & Events)        (Dev Tools)      │
│                                                              │
└────────────────┬──────────────────────────────────────┬─────┘
                 │                                      │
                 │ depends on                           │
                 │                                      │
LAYER 2 (TypeScript Config)
┌────────────────┴──────────────────────────────────────┴─────┐
│                                                              │
│              @netwatch/tsconfig                             │
│              (Base TypeScript Configuration)                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

✅ Flow is UNIDIRECTIONAL:
   - Apps depend on Shared Packages
   - Shared Packages depend on TypeScript Config
   - NO circular dependencies
   - NO app-to-app dependencies

❌ FORBIDDEN:
   - Frontend → Backend
   - Backend → Frontend
   - Shared → Apps
   - Shared → Shared (except config)
```

---

## 3. Backend Module Internal Structure

```
modules/players/

┌────────────────────────────────────────────────────────────┐
│                     players.module.ts                       │
│                  (NestJS Module Definition)                 │
└─────────────────────────┬──────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼

┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   DOMAIN     │  │  APPLICATION     │  │ INFRASTRUCTURE   │
├──────────────┤  ├──────────────────┤  ├──────────────────┤
│              │  │                  │  │                  │
│ Pure Logic   │  │ Use Cases        │  │ Repositories     │
│              │  │ Orchestration    │  │ Mappers          │
│ - Entity     │  │                  │  │ Adapters         │
│ - Aggregate  │  │ - Create         │  │                  │
│ - Events     │  │ - Update         │  │ - PlayerRepository
│              │  │ - Delete         │  │ - PlayerMapper   │
│ No Framework │  │ - Query          │  │                  │
│ No Database  │  │                  │  │ Depends on:      │
│ No HTTP      │  │ Depends on:      │  │ - Domain         │
│              │  │ - Domain         │  │ - NestJS         │
│              │  │ - Repositories   │  │ - Database       │
│              │  │                  │  │                  │
└──────────────┘  └──────────────────┘  └──────────────────┘
        ▲                 ▲                      ▲
        │                 │                      │
        └─────────────────┴──────────────────────┘
                          │
                          │ Exports private services
                          │ (injected via NestJS)
                          │
┌──────────────────────────────────────────────────────────┐
│                 PRESENTATION (Controllers)                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  HTTP Routes:                                            │
│  - POST /players (create)                                │
│  - GET /players/:id (read)                               │
│  - PUT /players/:id (update)                             │
│  - DELETE /players/:id (delete)                          │
│                                                           │
│  Injects: Use Cases (from Application layer)            │
│  Returns: DTOs from @netwatch/contracts                 │
│                                                           │
│  Depends on:                                             │
│  - Application (use cases)                              │
│  - NestJS (@Controller, @Post, etc.)                    │
│  - @netwatch/contracts (DTOs)                           │
│                                                           │
└──────────────────────────────────────────────────────────┘

IMPORT DIRECTION (Strict Acyclic):
  Presentation → Application → Domain
  Presentation → Infrastructure → Domain
  Infrastructure → Domain
  (NEVER: Domain → anything, Application → Presentation)
```

---

## 4. Data Flow: From HTTP Request to Database

```
HTTP Request
│
│  POST /players { displayName: "Alice" }
│
▼
┌───────────────────────────┐
│ Controller (presentation) │
│  - Receives DTO           │
│  - Validates              │
│  - Calls use case         │
└─────────┬─────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Use Case (application)       │
│  - Orchestrates logic        │
│  - Calls repository          │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Repository (infrastructure)      │
│  - Creates mapper               │
│  - Sends INSERT to database     │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Database (PostgreSQL)            │
│  - INSERT INTO players (...)     │
│  - Returns row                   │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Mapper (infrastructure)          │
│  - Reconstructs PlayerAggregate  │
│  - Enforces invariants           │
│  - Returns domain object         │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Use Case (application)           │
│  - Publishes domain event        │
│  - Returns result                │
└─────────┬────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│ Controller (presentation)        │
│  - Converts to response DTO      │
│  - Returns HTTP 201              │
└──────────┬───────────────────────┘
           │
           ▼
        HTTP Response
      { id, displayName, ... }
```

---

## 5. Domain-to-Database Mapping

```
Domain Model (packages/domain)
│
├─ Entity: Player
│  ├─ id: PlayerId
│  ├─ userId: UserId
│  ├─ displayName: string
│  └─ energy: Energy
│      ├─ current: number
│      └─ max: number
│
├─ Entity: Computer (nested in Player)
│  ├─ id: ComputerId
│  ├─ ownerId: PlayerId
│  ├─ name: string
│  └─ firewallLevel: number
│
└─ Value Object: Money
   └─ amount: number

Database Schema (PostgreSQL)
│
├─ Table: players
│  ├─ id (UUID, PK)
│  ├─ user_id (UUID, FK)
│  ├─ display_name (VARCHAR)
│  ├─ energy (INTEGER)
│  ├─ energy_max (INTEGER)
│  └─ money (BIGINT)
│
├─ Table: computers
│  ├─ id (UUID, PK)
│  ├─ owner_id (UUID, FK → players.id)
│  ├─ name (VARCHAR)
│  └─ firewall_level (INTEGER)
│
└─ Table: (others...)

Mapping Rules
│
├─ PlayerAggregate → players table
│  ├─ Player entity → insert/update players row
│  ├─ Nested Computer entities → separate computers rows (FK)
│  └─ Money value object → money column
│
├─ Database → Domain (Mapper)
│  ├─ SELECT * FROM players WHERE id = $1
│  ├─ SELECT * FROM computers WHERE owner_id = $1
│  └─ Reconstruct PlayerAggregate (with nested computers)
│
└─ Invariants enforced at both levels
   ├─ DB: CHECK (energy >= 0 AND energy <= energy_max)
   └─ Mapper: Validate during reconstruction
```

---

## 6. Real-Time Event Flow (WebSocket)

```
Client (Browser)
│
│  const socket = io('ws://localhost:3000')
│  socket.on('hack:completed', (event) => { ... })
│
▼
┌──────────────────────────────┐
│ Frontend                     │
│ - useGameState hook          │
│ - Subscribes to events       │
│ - Updates UI state           │
└─────────┬────────────────────┘
          │
   WebSocket Connection
          │
▼──────────────────────────────┐
                               │
                    Backend (Server)
                               │
┌──────────────────────────────┘
│
│  Domain Event Occurs:
│  - HackExecuted event fired
│
▼
┌──────────────────────────────┐
│ Use Case                     │
│ - Publishes domain event     │
│ - Triggers side effects      │
└─────────┬────────────────────┘
          │
          ▼
┌──────────────────────────────┐
│ Event Gateway (WebSocket)    │
│ - Broadcasts event           │
│ - To all connected clients   │
└─────────┬────────────────────┘
          │
          │  WebSocket Event
          │  {
          │    "type": "hack:completed",
          │    "payload": { ... }
          │  }
          │
▼──────────────────────────────┐
                               │
                    Frontend (Browser)
                               │
└──────────────────────────────┐
│
│  Game State Updates
│  - UI re-renders
│  - Player sees results
│
▼
```

Event types are defined in `@netwatch/contracts/src/events/`

---

## 7. Build Pipeline (Turborepo)

```
Source Code Changes
│
▼
┌────────────────────────────────────┐
│ pnpm build                         │
│ (Compile all packages in order)    │
└─────────────────────────────────┬──┘
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
    ┌───────────▼────────────┐      ┌──────────────▼────────────┐
    │ Phase 1: Base Configs  │      │                           │
    │ (no dependencies)      │      │                           │
    │                        │      │                           │
    │ @netwatch/tsconfig     │      │                           │
    │ @netwatch/config       │      │                           │
    │                        │      │                           │
    └───────────┬────────────┘      │                           │
                │                   │                           │
    ┌───────────▼────────────┐      │                           │
    │ Phase 2: Shared Code   │      │                           │
    │ (depends on base)      │      │                           │
    │                        │      │                           │
    │ @netwatch/domain       │      │                           │
    │ @netwatch/contracts    │      │                           │
    │                        │      │                           │
    └───────────┬────────────┘      │                           │
                │                   │                           │
    ┌───────────┴────────────┐      │                           │
    │                        │      │                           │
    ▼                        ▼      ▼                           │
┌──────────────┐      ┌──────────────┐                          │
│ apps/backend │      │ apps/frontend│                          │
│  (build)     │      │  (build)     │                          │
│  ✅ dist/    │      │  ✅ dist/    │                          │
└──────┬───────┘      └──────┬───────┘                          │
       │                     │                                  │
       └──────────┬──────────┘                                  │
                  │                                             │
                  ▼                                             │
         ┌────────────────┐                                     │
         │ BUILD COMPLETE │                                     │
         │ All dist/ done │                                     │
         └────────────────┘                                     │
                                                               │
         ┌─────────────────────────────────────────────────────┘
         │
         ▼
      Cache
   (Turborepo)
    - Track
    - Reuse
    - Skip if unchanged

Dependency Graph:
@netwatch/tsconfig
        ↓
@netwatch/config + @netwatch/domain
        ↓
@netwatch/contracts
        ↓
apps/backend + apps/frontend
```

---

## 8. Module Communication Pattern

```
Module A (e.g., players)
│
├─ Service (public interface)
│  └─ Method: async createPlayer(cmd): Promise<Player>
│
└─ Repository (private)
   └─ Method: async save(player): Promise<void>

Module B (e.g., hacks)
│
└─ Use Case: Execute Hack
   │
   ├─ Needs: Player data
   │
   └─ How to access?

    ✅ CORRECT (Dependency Injection):

    constructor(
      @Inject('PlayerService')
      private playerService: PlayerService
    ) {}

    async execute(cmd) {
      const player = await this.playerService.findById(cmd.playerId);
      // ... execute hack logic
    }

    ❌ WRONG (Direct import):

    import { PlayerRepository } from '../players/..';
    // Repository is private to players module!

    ❌ WRONG (Direct service import):

    import { PlayerService } from '../players/..';
    // Services are injected, not imported


Dependency Injection Container:
┌────────────────────────────────────┐
│ NestJS Module (@Module decorator)  │
├────────────────────────────────────┤
│                                    │
│ providers: [                       │
│   HackService,        ← provided   │
│   HackRepository,                  │
│   PlayerService,      ← injected   │
│   // ^ from players module         │
│ ]                                  │
│                                    │
│ exports: [HackService]             │
│ ← only this is public              │
│                                    │
└────────────────────────────────────┘
```

---

## 9. Shared Package Exports (Barrel Pattern)

```
@netwatch/domain
│
├─ src/
│  ├─ entities/
│  │  ├─ user.entity.ts
│  │  ├─ player.entity.ts
│  │  └─ computer.entity.ts
│  │
│  ├─ value-objects/
│  │  ├─ money.ts
│  │  ├─ energy.ts
│  │  └─ ip-address.ts
│  │
│  ├─ aggregates/
│  │  └─ player.aggregate.ts
│  │
│  └─ index.ts  ◄─── PUBLIC API (ONLY EXPORT FROM HERE)
│     │
│     └─ export { User } from './entities/user.entity';
│        export { Player } from './entities/player.entity';
│        export { Money } from './value-objects/money';
│        export { PlayerAggregate } from './aggregates/player.aggregate';
│        // ... etc

Usage in Backend:
┌─────────────────────────────────┐
│ ✅ import { Player } from '@netwatch/domain';
│ ✅ import { Money } from '@netwatch/domain';
│ ✅ import { PlayerAggregate } from '@netwatch/domain';
│ ✅ All public API available
└─────────────────────────────────┘

Usage in Frontend:
┌─────────────────────────────────┐
│ ✅ import { Player } from '@netwatch/domain';
│ ✅ Type-safe game objects
│ ✅ Aligned with backend
└─────────────────────────────────┘

❌ WRONG (Reach inside):
┌─────────────────────────────────┐
│ ❌ import { internal } from      │
│    '@netwatch/domain/src/...';   │
│ Breaks encapsulation!            │
└─────────────────────────────────┘
```

---

## 10. Repository to Table Mapping

```
Domain Aggregate
│
├─ PlayerAggregate
│  ├─ id: string
│  ├─ userId: string
│  ├─ displayName: string
│  ├─ energy: Energy
│  ├─ money: Money
│  ├─ computers: Computer[] ◄─ Nested
│  └─ hacks: Hack[] ◄─ Nested
│
└─ Maps to...

Database
│
├─ players table (for PlayerAggregate)
│  ├─ id (UUID)
│  ├─ user_id (UUID)
│  ├─ display_name
│  ├─ energy
│  ├─ energy_max
│  └─ money
│
├─ computers table (nested in PlayerAggregate)
│  ├─ id (UUID)
│  ├─ owner_id (FK → players.id)
│  ├─ name
│  └─ firewall_level
│
└─ hacks table (nested in PlayerAggregate)
   ├─ id (UUID)
   ├─ player_id (FK → players.id)
   ├─ target_computer_id (FK → computers.id)
   └─ status

Repository Pattern:
┌──────────────────────────────────┐
│ PlayerRepository                 │
├──────────────────────────────────┤
│                                  │
│ async save(                      │
│   aggregate: PlayerAggregate     │
│ ): Promise<void> {               │
│   // INSERT/UPDATE players row   │
│   // INSERT/UPDATE computers     │
│   // INSERT/UPDATE hacks         │
│ }                                │
│                                  │
│ async findById(                  │
│   id: string                     │
│ ): Promise<PlayerAggregate> {    │
│   // SELECT from players         │
│   // SELECT from computers (FK)  │
│   // SELECT from hacks (FK)      │
│   // Reconstruct aggregate       │
│   // Validate invariants         │
│   // Return PlayerAggregate      │
│ }                                │
│                                  │
└──────────────────────────────────┘
```

---

## Summary

1. **Unidirectional imports:** Apps → Shared → Config
2. **Domain models:** Pure TypeScript, no framework
3. **Repositories:** Private to module, map to aggregate roots
4. **Database:** One table per aggregate root
5. **Event flow:** Domain events → WebSocket broadcast → UI
6. **Module communication:** Dependency injection, not imports
7. **Shared exports:** Barrel pattern via `index.ts`
8. **Build order:** Config → Domain → Apps
9. **Real-time:** WebSocket with typed events
10. **Persistence:** Mappers reconstruct aggregates from rows

For details, refer to:

- [structure.md](structure.md) for folder organization
- [turborepo-pipelines.md](turborepo-pipelines.md) for build tasks
- [conventions.md](conventions.md) for coding standards
