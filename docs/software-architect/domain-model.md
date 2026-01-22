# Domain Model

## Overview

This document defines the core entities, value objects, aggregates, and domain events for the NetWatch game. The domain model represents the essential game mechanics independent of infrastructure concerns.

---

## Core Entities

### 1. User

**Responsibility:** Represents the human player with authentication and account data.

**Attributes:**

- `id: UUID` — Unique identifier
- `username: string` — Unique login name
- `passwordHash: string` — Hashed password (bcrypt)
- `email: string` — Contact email (optional, for recovery)
- `createdAt: DateTime` — Account creation timestamp
- `lastLoginAt: DateTime` — Last session timestamp
- `isActive: boolean` — Account status (active/suspended)

**Invariants:**

- Username must be unique and 3-20 characters
- Email must be unique if provided
- Username cannot be changed after creation

**Behaviors:**

- `verifyPassword(plainPassword: string): boolean` — Validate login credentials
- `updatePassword(newPasswordHash: string): void` — Change password
- `recordLogin(): void` — Update last login timestamp

---

### 2. Player

**Responsibility:** Represents a game character/avatar with gameplay resources and progression.

**Attributes:**

- `id: UUID` — Unique identifier
- `userId: UUID` — Foreign key to User (1:1 relationship)
- `displayName: string` — In-game display name (can differ from username)
- `createdAt: DateTime` — Character creation timestamp

**Resources:**

- `energy: number` — Consumed by actions, regenerates over time
- `money: number` — In-game currency, earned from successful hacks

**Progression:**

- `experience: number` — Total XP earned
- `level: number` — Computed from experience
- `skillPoints: number` — Unspent points for upgrades

**Invariants:**

- Each User has exactly one Player (1:1 in MVP)
- Energy cannot exceed max capacity (based on level)
- Money cannot be negative
- Level is computed from experience (read-only)

**Behaviors:**

- `canAfford(cost: Money): boolean` — Check if player has sufficient funds
- `consumeEnergy(amount: number): void` — Deduct energy, throw if insufficient
- `earnMoney(amount: number): void` — Add money from successful action
- `gainExperience(amount: number): void` — Add XP, trigger level-up if threshold reached

---

### 3. Computer

**Responsibility:** Represents a virtual system (owned by a player) that can be hacked or defended.

**Attributes:**

- `id: UUID` — Unique identifier
- `ownerId: UUID` — Foreign key to Player
- `name: string` — Player-assigned name (e.g., "MainServer")
- `ipAddress: string` — Virtual IP for targeting (generated, unique)
- `createdAt: DateTime` — Creation timestamp

**Resources:**

- `storage: number` — Virtual disk space (MB)
- `cpu: number` — Processing power (abstract units)
- `memory: number` — RAM (MB)

**State:**

- `isOnline: boolean` — Whether computer is active (offline = immune to hacks)
- `firewallLevel: number` — Defense strength (0-100)

**Invariants:**

- Each player must have at least one computer
- IP address must be unique across all computers
- Firewall level bounded by upgrades

**Behaviors:**

- `isVulnerableTo(attack: HackAttempt): boolean` — Check if hack can proceed
- `applyDamage(amount: number): void` — Reduce resources after successful hack
- `installDefense(defense: Defense): void` — Add protection
- `removeDefense(defenseId: UUID): void` — Uninstall protection

---

### 4. HackOperation

**Responsibility:** Represents an ongoing or completed hacking attempt.

**Attributes:**

- `id: UUID` — Unique identifier
- `attackerId: UUID` — Foreign key to Player
- `targetComputerId: UUID` — Foreign key to Computer
- `startedAt: DateTime` — Initiation timestamp
- `completionAt: DateTime` — Scheduled completion time
- `status: HackStatus` — Enum: `pending`, `in_progress`, `succeeded`, `failed`, `aborted`

**Configuration:**

- `hackType: HackType` — Enum: `steal_money`, `steal_data`, `install_virus`, `ddos`
- `toolsUsed: ToolId[]` — References to tools/software used
- `estimatedDuration: number` — Seconds to complete (based on difficulty)

**Result (populated on completion):**

- `successRoll: number` — Random roll vs. difficulty
- `resourcesStolen: Money` — Amount gained (if successful)
- `detectedByTarget: boolean` — Whether target was notified

**Invariants:**

- Attacker cannot hack their own computers
- Status transitions must follow: `pending` → `in_progress` → `succeeded|failed|aborted`
- Completion timestamp must be in the future when created

**Behaviors:**

- `calculateSuccessProbability(): number` — Compute chance based on attacker skill vs. target defenses
- `execute(): HackResult` — Perform success roll, apply effects, return outcome
- `abort(): void` — Cancel operation, refund partial energy

---

### 5. Defense

**Responsibility:** Represents installed security software on a Computer.

**Attributes:**

- `id: UUID` — Unique identifier
- `computerId: UUID` — Foreign key to Computer
- `defenseType: DefenseType` — Enum: `firewall`, `antivirus`, `honeypot`, `ids`
- `level: number` — Upgrade tier (1-5)
- `installedAt: DateTime` — Installation timestamp

**Properties:**

- `effectivenessBonus: number` — Reduction in hack success probability (%)
- `maintenanceCost: Money` — Periodic upkeep (future feature)

**Invariants:**

- Defense type + computer must be unique (one firewall per computer)
- Level must be within bounds (1-5)

**Behaviors:**

- `getEffectiveness(): number` — Calculate defense contribution
- `upgrade(): void` — Increment level, deduct cost

---

### 6. ProgressionUnlock

**Responsibility:** Tracks features/tools/upgrades available to a player.

**Attributes:**

- `id: UUID` — Unique identifier
- `playerId: UUID` — Foreign key to Player
- `unlockType: UnlockType` — Enum: `tool`, `defense`, `upgrade`, `skill`
- `unlockKey: string` — Identifier (e.g., "port_scanner", "firewall_tier_2")
- `unlockedAt: DateTime` — Unlock timestamp

**Invariants:**

- Player + unlockKey must be unique (no duplicate unlocks)

**Behaviors:**

- `isUnlocked(key: string): boolean` — Check if player has access

---

## Value Objects

### Money

- Represents in-game currency
- Immutable value object
- Methods: `add(Money): Money`, `subtract(Money): Money`, `isGreaterThan(Money): boolean`

### Energy

- Represents action resource
- Bounded by max capacity
- Methods: `consume(amount): Energy`, `regenerate(amount): Energy`

### HackResult

- Encapsulates outcome of a hack operation
- Properties: `success: boolean`, `stolenAmount: Money`, `detected: boolean`

### SkillSet

- Player's hacking skills (e.g., `stealth`, `cracking`, `programming`)
- Methods: `getSkillLevel(skill: SkillType): number`

---

## Aggregates

### User Aggregate

**Root:** User  
**Entities:** User  
**Consistency Boundary:** All changes to user authentication and profile must be atomic.

**Responsibilities:**

- Enforce authentication rules
- Manage login sessions
- Validate credentials

---

### Player Aggregate

**Root:** Player  
**Entities:** Player, ProgressionUnlock  
**Consistency Boundary:** All changes to player resources and unlocks must be atomic.

**Responsibilities:**

- Enforce resource constraints (energy, money)
- Manage progression (XP, levels, unlocks)
- Validate action preconditions (e.g., "can afford this tool?")

---

### Computer Aggregate

**Root:** Computer  
**Entities:** Computer, Defense  
**Consistency Boundary:** All changes to computer state and defenses must be atomic.

**Responsibilities:**

- Enforce defense installation rules
- Calculate total defense effectiveness
- Apply damage from successful hacks

---

### HackOperation Aggregate

**Root:** HackOperation  
**Consistency Boundary:** Operation lifecycle (creation → execution → completion) must be atomic.

**Responsibilities:**

- Validate hack initiation (attacker has resources, target is valid)
- Execute hack logic (success roll, resource transfer)
- Emit events on state transitions

---

## Domain Events

Domain events represent significant state changes and trigger side effects.

### UserRegistered

- `userId: UUID`
- `username: string`
- `email: string`
- `timestamp: DateTime`

**Triggered when:** New user account created  
**Subscribers:** Send welcome email, create Player entity, log analytics

---

### PlayerCreated

- `playerId: UUID`
- `userId: UUID`
- `displayName: string`
- `timestamp: DateTime`

**Triggered when:** Player character created (post-registration)  
**Subscribers:** Create default computer, initialize resources, grant starter unlocks

---

### HackOperationStarted

- `operationId: UUID`
- `attackerId: UUID`
- `targetComputerId: UUID`
- `estimatedCompletion: DateTime`
- `timestamp: DateTime`

**Triggered when:** Player initiates hack  
**Subscribers:** Notify target player, schedule completion event, deduct attacker energy

---

### HackOperationCompleted

- `operationId: UUID`
- `success: boolean`
- `stolenAmount: Money`
- `detected: boolean`
- `timestamp: DateTime`

**Triggered when:** Hack finishes (success or failure)  
**Subscribers:** Transfer resources, notify both players, update leaderboards, grant XP

---

### DefenseInstalled

- `computerId: UUID`
- `defenseType: DefenseType`
- `level: number`
- `timestamp: DateTime`

**Triggered when:** Player installs/upgrades defense  
**Subscribers:** Deduct money, update computer defense rating

---

### PlayerLeveledUp

- `playerId: UUID`
- `newLevel: number`
- `skillPointsGranted: number`
- `timestamp: DateTime`

**Triggered when:** Player gains enough XP to level up  
**Subscribers:** Grant skill points, unlock new features, notify player

---

### EnergyRegenerated

- `playerId: UUID`
- `amountRestored: number`
- `timestamp: DateTime`

**Triggered when:** Periodic energy regeneration occurs  
**Subscribers:** Update player energy, notify client if online

---

## Domain Services

Domain services encapsulate business logic that doesn't naturally fit in a single entity.

### HackingRulesService

**Responsibility:** Calculate hack success probability and outcomes.

**Methods:**

- `calculateSuccessProbability(attacker: Player, target: Computer, tools: Tool[]): number`
  - Factors: Attacker skill, target defenses, tool quality, randomness
- `determineOutcome(probability: number): HackResult`
  - Roll random number, compare to probability
- `calculateResourceGain(target: Computer, hackType: HackType): Money`
  - Determine loot based on target resources and hack type

---

### ResourceTransferService

**Responsibility:** Safely transfer resources between players/computers.

**Methods:**

- `transferMoney(from: Player, to: Player, amount: Money): void`
  - Atomic debit/credit, enforce non-negative constraint
- `stealResources(operation: HackOperation, result: HackResult): void`
  - Transfer loot from target owner to attacker

---

### ProgressionService

**Responsibility:** Manage leveling and unlocks.

**Methods:**

- `checkLevelUp(player: Player): boolean`
  - Determine if XP threshold reached
- `applyLevelUp(player: Player): void`
  - Increment level, grant skill points, emit event
- `grantUnlock(player: Player, unlockKey: string): void`
  - Add ProgressionUnlock record, validate prerequisites

---

## Domain Rules (Business Invariants)

1. **Action Cost Enforcement:**
   - Every action (hack, defense installation) must verify resource availability before execution
   - Energy/money deducted atomically with action initiation

2. **Hack Targeting:**
   - Players cannot hack their own computers
   - Target computer must be online
   - Attacker must meet minimum level requirement for hack type

3. **Defense Limits:**
   - Each computer can have at most one of each defense type
   - Defense level cannot exceed player's progression unlocks

4. **Concurrent Operation Limits:**
   - Player can have at most N simultaneous hack operations (e.g., 3)
   - Enforced via aggregate validation

5. **State Consistency:**
   - HackOperation status transitions are unidirectional (no "un-failing" a hack)
   - Resource transfers are atomic (via database transactions)

6. **Progression Gating:**
   - Advanced hack types locked until player reaches specific level
   - Unlocks are permanent (no "de-leveling")

---

## Entity Relationships (High-Level)

```
User (1) ────── (1) Player
                   │
                   │
Player (1) ──────< (N) Computer
  │                      │
  │                      │
  │                      └──< (N) Defense
  │
  ├──< (N) ProgressionUnlock
  │
  └──< (N) HackOperation (as attacker or target)
```

---

## Bounded Context Boundaries

While the MVP is a monolith, we identify logical contexts for future modularity:

### Identity & Access Context

- Entities: User
- Responsibilities: Registration, authentication, login sessions, account management

### Game Core Context

- Entities: Player, Computer, HackOperation, Defense
- Responsibilities: Core gameplay mechanics, hacking, defenses, resource management

### Progression Context

- Entities: ProgressionUnlock, Player (XP/levels)
- Responsibilities: Leveling, skill trees, unlocks

**Integration:** Contexts communicate via domain events (e.g., `UserRegistered` triggers `PlayerCreated`, `PlayerLeveledUp` triggers unlock checks).

---

## Example: Hack Operation Lifecycle

```typescript
// 1. Player initiates hack (Application Service)
const operation = HackOperation.create({
  attackerId: player.id,
  targetComputerId: targetComputer.id,
  hackType: HackType.STEAL_MONEY,
  toolsUsed: [ToolId.PORT_SCANNER],
  estimatedDuration: 120, // seconds
});

// 2. Validate preconditions (Domain)
player.consumeEnergy(operation.energyCost);
if (!targetComputer.isVulnerableTo(operation)) {
  throw new Error("Target is protected");
}

// 3. Persist operation
await hackOperationRepo.save(operation);

// 4. Emit event
eventBus.publish(new HackOperationStarted(operation));

// 5. Schedule completion
eventScheduler.schedule(operation.completionAt, async () => {
  // 6. Execute hack (Domain Service)
  const result = hackingRulesService.determineOutcome(operation);

  // 7. Apply effects
  if (result.success) {
    resourceTransferService.stealResources(operation, result);
  }

  // 8. Update operation
  operation.complete(result);
  await hackOperationRepo.save(operation);

  // 9. Emit completion event
  eventBus.publish(new HackOperationCompleted(operation, result));
});
```

---

## Summary

The domain model establishes:

- **Entities:** User, Player, Computer, HackOperation, Defense, ProgressionUnlock
- **Value Objects:** Money, Energy, HackResult, SkillSet
- **Aggregates:** User, Player (+ unlocks), Computer (+ defenses), HackOperation
- **Domain Events:** User/player lifecycle, actions, progression, and state changes
- **Domain Services:** HackingRules, ResourceTransfer, Progression
- **Invariants:** Authentication rules, resource constraints, targeting rules, state transitions

This model is **technology-agnostic** and serves as the foundation for implementation. Infrastructure adapters (TypeORM repositories, WebSocket gateways) will map to/from these domain constructs.
