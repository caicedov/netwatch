# Technical Architecture Decision Records

## ADR-001: Technology Stack

### Context

Need to select backend and frontend technologies for a real-time multiplayer game with server-authoritative architecture, built by a single developer.

### Decision

- **Backend:** Node.js with TypeScript + NestJS framework
- **Frontend:** React with TypeScript + Next.js framework
- **Database:** PostgreSQL with TypeORM
- **Real-time:** WebSockets (Socket.IO or native WebSocket with fallback)

### Rationale

- **TypeScript across stack:** Single language reduces context switching, enables code sharing (types, validation, domain models)
- **NestJS:** Provides structure, dependency injection, and modularity without overengineering; aligns with enterprise patterns for scalability
- **Next.js:** Modern React framework with SSR/SSG options, file-based routing, and optimized production builds
- **PostgreSQL:** ACID compliance essential for concurrent game state; JSON support allows schema flexibility; strong ecosystem
- **WebSockets:** Bidirectional low-latency communication required for real-time gameplay

### Consequences

- Positive: Unified language, strong typing, large ecosystem, good performance for target scale
- Negative: Node.js single-threaded model requires careful handling of CPU-intensive operations
- Mitigation: Offload heavy computations to worker threads or separate services if needed

---

## ADR-002: Real-Time Communication Model

### Context

Game requires server → client push for action results, state updates, and event notifications.

### Decision

Implement **bidirectional persistent WebSocket connections** with fallback transport support.

**Communication Patterns:**

1. **Client → Server:** Action commands (start hack, deploy defense, etc.)
2. **Server → Client:** State updates (action progress, resource changes, attack notifications)
3. **Server → Multiple Clients:** Broadcast events when actions affect multiple players

### Rationale

- HTTP polling introduces latency and overhead
- WebSockets provide low-latency, full-duplex communication
- Library support (Socket.IO) includes automatic reconnection and fallback transports

### Message Structure

```typescript
{
  type: "action" | "state_update" | "event",
  payload: { /* typed data */ },
  timestamp: number,
  requestId?: string // for correlation
}
```

### Consequences

- Positive: Real-time experience, efficient bandwidth usage
- Negative: Stateful connections require careful session management
- Mitigation: Implement connection health checks, reconnection logic, and session recovery

---

## ADR-003: State Management Strategy

### Context

Game state includes player resources, active hacking operations, defenses, and progression. State must remain consistent across concurrent player actions.

### Decision

**Hybrid state management:**

1. **Persistent State (PostgreSQL):**
   - Player accounts, resources, inventory
   - Completed actions and history
   - Progression and unlocks

2. **Transient State (In-Memory):**
   - Active hacking operations in progress
   - WebSocket session mappings
   - Temporary caches for frequently accessed data

3. **State Synchronization:**
   - Server is single source of truth
   - Clients receive incremental updates via WebSocket
   - Optimistic UI updates with server reconciliation

### Rationale

- Persistent DB ensures durability and supports complex queries
- In-memory state reduces latency for active operations
- Clear separation simplifies reasoning about consistency

### Concurrency Control

- Database transactions for multi-step operations
- Row-level locking for resource modifications
- Domain logic validates preconditions before applying changes

### Consequences

- Positive: Balance between performance and consistency
- Negative: Need to synchronize in-memory and persistent state carefully
- Mitigation: Use domain events to trigger persistence; implement crash recovery

---

## ADR-004: Backend Architecture Pattern

### Context

Need to organize server-side code for maintainability, testability, and evolution.

### Decision

Implement **Layered Architecture with Domain-Driven Design principles:**

```
┌─────────────────────────────────┐
│   Presentation Layer            │  ← WebSocket/REST controllers
├─────────────────────────────────┤
│   Application Layer             │  ← Use cases, orchestration
├─────────────────────────────────┤
│   Domain Layer                  │  ← Core game logic, entities
├─────────────────────────────────┤
│   Infrastructure Layer          │  ← Database, external services
└─────────────────────────────────┘
```

**Key Modules:**

- `identity`: User authentication, registration, sessions
- `game-engine`: Core domain logic (hacking, defenses, resources)
- `player-management`: Player profiles, progression, resources
- `real-time`: WebSocket gateway and event broadcasting
- `persistence`: Database repositories and ORMs

### Rationale

- Clear separation of concerns
- Domain logic isolated from infrastructure
- NestJS modules align naturally with this pattern
- Testable without infrastructure dependencies (using ports/adapters)

### Consequences

- Positive: Clean architecture, easier testing, supports evolution
- Negative: More abstraction layers than simple CRUD
- Trade-off: Acceptable for game logic complexity

---

## ADR-005: Client Architecture Pattern

### Context

Frontend must handle real-time updates, optimistic UI, and maintain responsive UX.

### Decision

**Component-based architecture with unidirectional data flow:**

- **State Management:** React Context + Reducers (or Zustand for simplicity)
- **Real-time Integration:** Custom WebSocket hook managing connection and subscriptions
- **UI Components:** Functional components with TypeScript interfaces

**Data Flow:**

1. User interaction → dispatch action
2. Optimistic UI update (optional)
3. Send command to server via WebSocket
4. Receive server response → reconcile state
5. Re-render affected components

### Rationale

- React's component model suits game UI with frequent updates
- Centralized state simplifies debugging and time-travel
- WebSocket abstraction isolates real-time complexity

### Consequences

- Positive: Predictable state flow, good developer experience
- Negative: Requires careful handling of race conditions
- Mitigation: Use request IDs to correlate responses; implement retry logic

---

## ADR-006: Authentication & Authorization

### Context

Players must authenticate securely; actions must be authorized server-side.

### Decision

**JWT-based authentication with session management:**

1. **Registration/Login:** Username/password → server issues JWT
2. **WebSocket Authentication:** Client sends JWT during handshake; server validates and attaches user context
3. **Authorization:** Server validates all actions against player's current state (resources, permissions, etc.)

**Session Management:**

- JWTs contain user ID and expiration
- Refresh token mechanism for long sessions
- Server maintains active WebSocket sessions in memory

### Rationale

- JWTs are stateless and work well with WebSockets
- Server-side validation ensures security
- Simple to implement with Passport.js or similar

### Consequences

- Positive: Secure, scalable, industry-standard
- Negative: JWT revocation requires additional mechanism
- Mitigation: Short-lived access tokens + refresh tokens

---

## ADR-007: Game Loop & Time Model

### Context

Game operates in continuous real-time, not turns. Actions have durations (e.g., "hack takes 2 minutes").

### Decision

**Event-driven time progression:**

1. Actions create **scheduled events** with completion timestamps
2. Server maintains priority queue of pending events
3. Background worker processes events as they mature
4. State updates broadcast to affected clients

**Example Flow:**

```
Player A starts hack on Player B (duration: 120s)
  → Create HackOperation entity, completion_at = now + 120s
  → Notify Player B of incoming attack
  → Worker detects completion at T+120s
  → Execute hack result (success/fail, resource transfer)
  → Broadcast results to both players
```

### Rationale

- Decouples action initiation from completion
- Scalable: doesn't require constant polling
- Supports complex multi-step operations

### Implementation

- Use PostgreSQL for durable event storage
- In-memory queue for fast processing of near-term events
- Cron job or timer scans for matured events every few seconds

### Consequences

- Positive: Flexible, supports async gameplay
- Negative: Requires careful timestamp handling and clock synchronization
- Mitigation: Use server time exclusively; clients display relative countdowns

---

## ADR-008: Data Modeling Strategy

### Context

Game entities have relationships and constraints (players, computers, operations, resources).

### Decision

**Relational modeling with domain aggregates:**

**Core Entities:**

- `User`: Authentication, account credentials, login sessions
- `Player`: Game character, resources, progression (1:1 with User)
- `Computer`: Virtual system owned by player, has resources and defenses
- `HackOperation`: Active or historical hacking attempt
- `Defense`: Installed security measures
- `ProgressionUnlock`: Features/upgrades available to player

**Relationships:**

- User 1:1 Player (each user has one character in MVP)
- Player 1:N Computer (players can own multiple systems)
- Computer 1:N Defense
- Player N:M HackOperation (attacker/target)

**Consistency Boundaries:**

- Aggregate root: User (authentication)
- Aggregate root: Player (owns resources)
- Aggregate root: HackOperation (atomic state transitions)

### Rationale

- Relational model fits structured game state
- Foreign keys enforce referential integrity
- Aggregates prevent invalid state transitions

### Consequences

- Positive: Data integrity, queryability, familiar patterns
- Negative: Schema migrations required for evolution
- Mitigation: Use migration tools (TypeORM migrations)

---

## ADR-009: Deployment Model (MVP)

### Context

Solo developer needs simple deployment with low operational overhead.

### Decision

**Monolithic deployment with containerization:**

- Single Node.js process serving API and WebSocket
- PostgreSQL database (managed service or containerized)
- Frontend served as static build (Next.js export or SSR)

**Infrastructure:**

- Docker Compose for local development
- Cloud deployment: Single VM or PaaS (Heroku, Railway, Render)
- CI/CD: GitHub Actions for automated testing and deployment

### Rationale

- Simplicity reduces operational burden
- Monolith sufficient for target concurrency (100-500 players)
- Containerization ensures environment consistency

### Future Evolution

- If scale demands: Separate WebSocket gateway, introduce load balancer
- If complexity grows: Extract microservices (e.g., authentication, game engine)

### Consequences

- Positive: Fast iteration, low cost, simple debugging
- Negative: Single point of failure, limited horizontal scaling
- Mitigation: Design for modularity; refactor when metrics justify

---

## ADR-010: Error Handling & Resilience

### Context

Distributed system with real-time interactions requires robust error handling.

### Decision

**Defense-in-depth error strategy:**

1. **Input Validation:** Client and server validate commands (TypeScript + class-validator)
2. **Domain Invariants:** Domain models enforce preconditions (e.g., "can't hack without resources")
3. **Graceful Failures:** Errors return structured messages to client; server logs for debugging
4. **Retry Logic:** Clients retry transient network errors with exponential backoff
5. **Circuit Breakers:** Protect external dependencies (if introduced later)

**Client Disconnection:**

- Server retains session state for configurable timeout (e.g., 5 minutes)
- Client reconnects → restore session
- Timeout → abort active operations, release resources

### Rationale

- Prevents invalid state from entering system
- Improves player experience during network hiccups
- Supports debugging and monitoring

### Consequences

- Positive: Robust, good UX, maintainable
- Negative: Requires careful state cleanup on timeout
- Mitigation: Use domain events to trigger cleanup logic

---

## Summary of Key Decisions

| Decision Area        | Choice                        | Primary Justification                |
| -------------------- | ----------------------------- | ------------------------------------ |
| Backend Language     | TypeScript (Node.js)          | Unified stack, strong typing         |
| Backend Framework    | NestJS                        | Structure, DI, modularity            |
| Frontend Framework   | Next.js + React               | Modern, SSR, ecosystem               |
| Database             | PostgreSQL                    | ACID, relational model, JSON support |
| Real-time Protocol   | WebSockets                    | Low latency, bidirectional           |
| Architecture Pattern | Layered + DDD                 | Separation of concerns, testability  |
| State Management     | Hybrid (DB + in-memory)       | Balance consistency and performance  |
| Time Model           | Event-driven scheduled events | Supports async continuous gameplay   |
| Deployment (MVP)     | Monolithic container          | Simplicity for solo developer        |
| Authentication       | JWT with WebSocket sessions   | Secure, scalable, standard           |
