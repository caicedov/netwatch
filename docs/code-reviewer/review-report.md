# Code Review Report: Backend Implementation

**Date:** 2026-01-24  
**Scope:** Application layer (services, use-cases, DTOs, controllers), auth infrastructure, module wiring  
**Reviewed Against:** [docs/software-architect/architecture-overview.md](docs/software-architect/architecture-overview.md), [docs/software-architect/domain-model.md](docs/software-architect/domain-model.md), [docs/software-architect/technical-adrs.md](docs/software-architect/technical-adrs.md), [docs/backend-engineer/api-contracts.md](docs/backend-engineer/api-contracts.md), [docs/code-reviewer/COMPLETION-STATUS.md](docs/code-reviewer/COMPLETION-STATUS.md)

---

## Executive Summary

- ✅ Application layer now exists (services, DTOs, controllers) with JWT guards and ValidationPipe configured; 11 HTTP endpoints implemented per [docs/code-reviewer/COMPLETION-STATUS.md](docs/code-reviewer/COMPLETION-STATUS.md).
- 🔴 Contract coverage is incomplete: several required endpoints and response shapes in [docs/backend-engineer/api-contracts.md](docs/backend-engineer/api-contracts.md) remain unimplemented or diverge (computers, hacks, defenses, unlock queries).
- 🔴 Persistence is still stubbed; no durable storage despite architectural requirement for PostgreSQL in [docs/software-architect/technical-adrs.md](docs/software-architect/technical-adrs.md), risking data loss and non-deterministic state.
- 🟡 Real-time WebSocket gateway is absent even though the architecture mandates server-pushed state ([docs/software-architect/architecture-overview.md](docs/software-architect/architecture-overview.md)).
- 🟡 Error handling and testing are missing (no exception filters, no unit/integration suites), leaving behavior undefined under failure.

---

## Issues by Severity

### 🔴 Critical

- **API contract divergence and missing endpoints**  
  Implemented routes cover only 11 endpoints, but the contract demands more. Gaps include: `POST /players/:playerId/computers`, `GET /players/:playerId/computers`, `GET /computers/:computerId`, `POST /hacks`, `GET /players/:playerId/hacks`, `POST /computers/:computerId/defenses/:defenseId/upgrade`, `GET /computers/:computerId/defenses`, `GET /players/:playerId/unlocks`, `GET /players/:playerId/unlocks/:unlockKey`. Additionally, the implemented hack start path `POST /hacks/:computerId/start` and computer creation path `POST /computers` do not match the documented URIs. Response DTOs also diverge (e.g., player energy structure, computer resource fields). This breaks client compatibility and contract-first guarantees.

- **No durable persistence layer**  
  Implementation still relies on repository stubs with no PostgreSQL integration, contrary to [docs/software-architect/technical-adrs.md](docs/software-architect/technical-adrs.md). Game state is volatile across process restarts, and concurrent access cannot be serialized. This jeopardizes correctness for all flows (auth, player creation, hacks, progression).

### 🟡 Major

- **Missing WebSocket gateway**  
  Real-time push is a core architectural principle ([docs/software-architect/architecture-overview.md](docs/software-architect/architecture-overview.md)), yet no `@WebSocketGateway` exists. Hack initiation currently triggers no server-driven updates to attackers/defenders, undermining real-time determinism and reconnection consistency.

- **Missing global error handling**  
  Custom exception filters/interceptors are absent (acknowledged in [docs/code-reviewer/COMPLETION-STATUS.md](docs/code-reviewer/COMPLETION-STATUS.md)). Without standardized error mapping, validation and domain errors will surface as framework defaults, yielding inconsistent `statusCode/message/error` shapes promised in [docs/backend-engineer/api-contracts.md](docs/backend-engineer/api-contracts.md).

- **No automated tests**  
  There is still no unit or integration coverage. Given the new application layer, guards, and DTO validation, absence of tests leaves regressions undetected—particularly around auth, ownership checks, and hack invariants.

### 🟢 Minor

- **Response shape gaps vs contract**  
  DTOs summarized in [docs/code-reviewer/COMPLETION-STATUS.md](docs/code-reviewer/COMPLETION-STATUS.md) omit several contract fields (e.g., computer `storage/cpu/memory`, player `energy.current/max`, defense `effectiveness`, hack `completionAt` naming). These mismatches will force client-side conditionals or break typed clients.

---

## Recommendations

1. Align REST surface with [docs/backend-engineer/api-contracts.md](docs/backend-engineer/api-contracts.md): add missing endpoints, fix URIs, and bring DTOs to contract parity (inputs and outputs). Enforce ownership via path parameters (`:playerId`) rather than relying solely on body/guard context.
2. Integrate PostgreSQL persistence per [docs/software-architect/technical-adrs.md](docs/software-architect/technical-adrs.md), including repositories, transactions for multi-aggregate updates, and migration coverage. Add deterministic IP allocation checks at the DB layer to avoid collisions.
3. Implement WebSocket gateway and event publication for hack lifecycle, defense changes, and progression unlocks to uphold the real-time, server-authoritative model.
4. Add global exception filters and error envelopes matching the documented error format; include validation failures, domain rule violations, and auth errors.
5. Establish automated tests (unit for services/use-cases; e2e for key routes with auth/guards). Cover negative paths: duplicate player creation, self-hack prevention, defense duplication, and invalid refresh tokens.

**Assessment**: Tier-1 domain implementation. Could serve as textbook DDD example.

---

### ✅ Correctly Aligned: Aggregate Pattern (One Table, One Mapper)

**Mapping Flow** (verified in code):

| Aggregate | Domain Entity | TypeORM Entity | Mapper | Table |
|-----------|---------------|----------------|--------|-------|
| User | User | UserEntity | UserMapper | users |