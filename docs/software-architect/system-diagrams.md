# System Diagrams

## 1. Context Diagram

```
                    ┌─────────────────┐
                    │     Player      │
                    │   (Web Browser) │
                    └────────┬────────┘
                             │ HTTPS + WebSocket
                             │
                             ▼
                    ┌─────────────────┐
                    │   NetWatch      │
                    │   Game System   │
                    └────────┬────────┘
                             │
                             │ (Future integrations)
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
          ┌──────────────┐   ┌──────────────┐
          │ Email Service│   │ Analytics    │
          │  (Optional)  │   │  (Optional)  │
          └──────────────┘   └──────────────┘
```

**Key Actors:**

- **Player:** End user accessing game via web browser
- **NetWatch Game System:** Server-authoritative game backend + frontend
- **External Services (Future):** Email notifications, analytics, monitoring

---

## 2. Container Diagram

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │          Next.js Frontend (React + TS)             │  │
│  │  - UI Components (dashboards, hacking console)     │  │
│  │  - WebSocket client hooks                          │  │
│  │  - State management (Context/Zustand)              │  │
│  └───────────────────┬────────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┘
                         │ HTTPS (API) + WSS (WebSocket)
                         │
┌────────────────────────┼─────────────────────────────────┐
│                        ▼      Backend Server (Node.js)   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              NestJS Application                     │ │
│  │ ┌─────────────────┐  ┌──────────────────────────┐  │ │
│  │ │ REST API        │  │ WebSocket Gateway        │  │ │
│  │ │ - Auth          │  │ - Real-time events       │  │ │
│  │ │ - Player mgmt   │  │ - Session management     │  │ │
│  │ └────────┬────────┘  └──────────┬───────────────┘  │ │
│  │          │                      │                   │ │
│  │          └──────────┬───────────┘                   │ │
│  │                     ▼                               │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │        Application Services Layer            │   │ │
│  │ │  - User authentication & management          │   │ │
│  │ │  - Game action orchestration                 │   │ │
│  │ │  - Player management                         │   │ │
│  │ │  - Event scheduling                          │   │ │
│  │ └─────────────────┬────────────────────────────┘   │ │
│  │                   ▼                                 │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │           Domain Layer                       │   │ │
│  │ │  - Game entities (User, Player, Computer)    │   │ │
│  │ │  - Game rules & validation                   │   │ │
│  │ │  - Domain events                             │   │ │
│  │ └─────────────────┬────────────────────────────┘   │ │
│  │                   ▼                                 │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │       Infrastructure Layer                   │   │ │
│  │ │  - Database repositories (TypeORM)           │   │ │
│  │ │  - Event scheduler (timer/worker)            │   │ │
│  │ └─────────────────┬────────────────────────────┘   │ │
│  └────────────────────┼──────────────────────────────┘ │
│                       │                                 │
│  ┌────────────────────▼──────────────────────────────┐ │
│  │         In-Memory State Store (Optional)          │ │
│  │  - Active operations cache                        │ │
│  │  - WebSocket session mapping                      │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────┘
                         │ SQL (TypeORM)
                         ▼
        ┌────────────────────────────────┐
        │      PostgreSQL Database       │
        │  - Users table                 │
        │  - Players table               │
        │  - Computers table             │
        │  - HackOperations table        │
        │  - Defenses table              │
        │  - ProgressionUnlocks table    │
        └────────────────────────────────┘
```

**Container Responsibilities:**

1. **Next.js Frontend:**
   - User interface rendering
   - Client-side state management
   - Real-time updates via WebSocket
   - Optimistic UI updates

2. **NestJS Backend:**
   - REST API for CRUD operations
   - WebSocket gateway for real-time events
   - Game logic execution
   - State validation and persistence

3. **PostgreSQL Database:**
   - Persistent game state
   - Player accounts and authentication
   - Action history and audit trail

4. **In-Memory Store:**
   - Active operation tracking
   - Session state caching
   - Performance optimization

---

## 3. Event Flow Diagram: Player Hacking Another Player

```
┌─────────┐          ┌─────────────┐          ┌──────────┐
│Player A │          │   Server    │          │Player B  │
│(Attacker)│          │             │          │(Target)  │
└────┬────┘          └──────┬──────┘          └────┬─────┘
     │                      │                      │
     │ 1. Click "Hack"      │                      │
     │─────────────────────>│                      │
     │                      │                      │
     │                      │ 2. Validate:         │
     │                      │   - A has resources  │
     │                      │   - B is valid target│
     │                      │   - No cooldown      │
     │                      │                      │
     │ 3. Ack + Operation ID│                      │
     │<─────────────────────│                      │
     │                      │                      │
     │                      │ 4. Create HackOp     │
     │                      │    in DB (pending)   │
     │                      │                      │
     │                      │ 5. Notify target     │
     │                      │─────────────────────>│
     │                      │  "Incoming attack!"  │
     │                      │                      │
     │ 6. Progress updates  │                      │
     │<─────────────────────│                      │
     │  (every N seconds)   │                      │
     │                      │                      │
     │                      │ 7. Background worker │
     │                      │    detects completion│
     │                      │                      │
     │                      │ 8. Execute outcome:  │
     │                      │   - Roll success/fail│
     │                      │   - Transfer resources│
     │                      │   - Update DB        │
     │                      │                      │
     │ 9. Result broadcast  │ 10. Result broadcast │
     │<─────────────────────│─────────────────────>│
     │  "Hack succeeded!"   │  "Hack failed!"      │
     │                      │  (or vice versa)     │
     │                      │                      │
     │ 11. Update UI        │                  12. Update UI
     │   (show rewards)     │                    (show damage)
     │                      │                      │
```

**Event Flow Steps:**

1. **Player A initiates hack** via UI (click button, target Player B)
2. **Server validates preconditions:**
   - Player A has sufficient resources (energy, tools)
   - Player B is valid target (online, not protected)
   - Player A not on cooldown
3. **Server acknowledges** and returns operation ID
4. **HackOperation record created** in database (status: `in_progress`)
5. **Server notifies Player B** via WebSocket: "You're under attack!"
6. **Progress updates sent** to Player A (e.g., "25% complete...")
7. **Background worker** detects operation completion (timestamp reached)
8. **Server executes outcome:**
   - Calculate success based on attacker skill vs. target defense
   - Transfer resources if successful
   - Update database atomically
9. **Result broadcast to Player A:** Success/failure, rewards/costs
10. **Result broadcast to Player B:** Attack outcome, losses
11. **Player A UI updates** to reflect new state
12. **Player B UI updates** to show attack results

---

## 4. Deployment Diagram (MVP)

```
┌───────────────────────────────────────────────────────────┐
│                   Cloud Provider (e.g., Render, Railway)  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Application Server (VM/Container)      │ │
│  │                                                     │ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │        Docker Container: netwatch-app         │ │ │
│  │  │                                               │ │ │
│  │  │  ┌─────────────────────────────────────────┐ │ │ │
│  │  │  │     Node.js Process (NestJS)            │ │ │ │
│  │  │  │  - REST API endpoints (port 3000)       │ │ │ │
│  │  │  │  - WebSocket server (port 3000)         │ │ │ │
│  │  │  │  - Next.js SSR/SSG (port 3000)          │ │ │ │
│  │  │  │  - Background event processor           │ │ │ │
│  │  │  └─────────────────────────────────────────┘ │ │ │
│  │  │                                               │ │ │
│  │  └───────────────────┬───────────────────────────┘ │ │
│  │                      │ TCP (internal)              │ │
│  │                      ▼                             │ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │    Docker Container: postgres                 │ │ │
│  │  │  - PostgreSQL 15+                             │ │ │
│  │  │  - Persistent volume mounted                  │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Load Balancer / Reverse Proxy          │ │
│  │                   (HTTPS termination)               │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTPS + WSS
                          ▼
                  ┌───────────────┐
                  │   Internet    │
                  │   (Clients)   │
                  └───────────────┘
```

**Deployment Components:**

1. **Application Container:**
   - Single Node.js process
   - Serves REST API, WebSocket, and frontend
   - Runs background workers for event processing

2. **Database Container:**
   - PostgreSQL with persistent storage
   - Managed backups (automated by platform)

3. **Load Balancer:**
   - HTTPS termination (SSL/TLS)
   - WebSocket upgrade support
   - Health checks

**Environment Configuration:**

- `.env` file with secrets (DB credentials, JWT secret)
- Environment-specific configs (dev, staging, prod)

**CI/CD Pipeline:**

```
GitHub Repository
      ↓
GitHub Actions
  - Run tests
  - Build Docker image
  - Push to registry
      ↓
Auto-deploy to cloud
  - Pull new image
  - Rolling restart
  - Health check
```

---

## 5. Data Flow: State Synchronization

```
┌────────────────────────────────────────────────────────────┐
│                        Server State                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL (Source of Truth)            │  │
│  │  - Player resources: {energy: 100, money: 500}       │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                    │
│                       ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Application Service Layer                    │  │
│  │  - Reads state on action                             │  │
│  │  - Applies domain logic                              │  │
│  │  - Writes updated state to DB                        │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                    │
│                       ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            WebSocket Event Broadcaster               │  │
│  │  - Identifies affected clients                       │  │
│  │  - Sends state delta (only changed fields)           │  │
│  └────────────────────┬─────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │ WebSocket message
                         ▼
┌────────────────────────────────────────────────────────────┐
│                      Client State                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             React State (Context/Zustand)            │  │
│  │  - Local copy: {energy: 100, money: 500}             │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                    │
│                       ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           WebSocket Message Handler                  │  │
│  │  - Receives: {energy: 80, money: 700}                │  │
│  │  - Merges into state                                 │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                    │
│                       ▼                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               UI Re-renders                          │  │
│  │  - Displays updated values                           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Synchronization Rules:**

1. Server state is always authoritative
2. Clients never mutate state directly
3. All actions flow through server validation
4. Server broadcasts minimal delta (not full state)
5. Clients reconcile optimistic updates with server responses

---

## 6. Module Dependency Diagram

```
┌───────────────────────────────────────────────────────────┐
│                     Presentation Layer                    │
│  ┌─────────────────┐         ┌──────────────────────┐    │
│  │  REST Controllers│         │ WebSocket Gateway    │    │
│  └────────┬─────────┘         └──────────┬───────────┘    │
└───────────┼────────────────────────────────┼───────────────┘
            │                                │
            ▼                                ▼
┌───────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │ PlayerService    │  │ GameActionService            │  │
│  │ - Register       │  │ - ExecuteHack                │  │
│  │ - Authenticate   │  │ - DeployDefense              │  │
│  └────────┬─────────┘  └──────────┬───────────────────┘  │
│           │                       │                       │
│  ┌────────▼───────────────────────▼───────────────────┐  │
│  │          EventSchedulerService                     │  │
│  │  - Schedule action completion                      │  │
│  │  - Process matured events                          │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                      Domain Layer                         │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │   User   │  │   Player    │  │  Computer    │  │ HackOperation  │   │
│  │  Entity  │  │  Entity     │  │   Entity     │  │    Entity      │   │
│  └──────────┘  └─────────────┘  └──────────────┘  └────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │            Domain Services                       │    │
│  │  - HackingRules (success calculation)            │    │
│  │  - ResourceManager (transfers, validation)       │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                     │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  TypeORM Repos   │  │  Event Scheduler (Timer)     │  │
│  │  - UserRepo      │  │  - Cron job / worker thread  │  │
│  │  - PlayerRepo    │  └──────────────────────────────┘  │
│  │  - ComputerRepo  │                                    │
│  │  - HackOpRepo    │                                    │
│  └────────┬─────────┘                                    │
└───────────┼──────────────────────────────────────────────┘
            │
            ▼
   ┌────────────────┐
   │   PostgreSQL   │
   └────────────────┘
```

**Dependency Rules:**

- Higher layers depend on lower layers
- Domain layer has no dependencies (pure business logic)
- Infrastructure implements interfaces defined by application/domain
- Presentation layer orchestrates but doesn't contain business logic

---

## Summary

These diagrams establish:

1. **Context:** Players interact with a unified game system via browser
2. **Containers:** Layered backend (NestJS), frontend (Next.js), and PostgreSQL
3. **Event Flow:** Real-time action lifecycle from initiation to completion
4. **Deployment:** Monolithic containerized architecture for MVP
5. **State Sync:** Server-authoritative with incremental client updates
6. **Modules:** Clean separation of presentation, application, domain, and infrastructure

All diagrams align with ADRs and support the core principle: **server authority, real-time events, domain-centric design**.
