/**
 * Backend Engineer - Real-time Events Documentation
 *
 * This document defines all WebSocket events for real-time game updates.
 * All events follow the command/event model for server-authoritative gameplay.
 */

# Real-time Events

## Event Model

### Client → Server (Commands)

Commands represent player **intent** and always receive validation by the server. Server rejects invalid commands.

**Format:**
```typescript
{
  type: "COMMAND_NAME",
  payload: { /* command data */ }
}
```

### Server → Client (Events)

Events represent **confirmed state changes**. Only the server emits events; clients listen and update local state.

**Format:**
```typescript
{
  type: "EVENT_NAME",
  timestamp: ISO8601,
  payload: { /* event data */ }
}
```

---

## 1. Connection Events

### Client connects to WebSocket
**Event:** `CONNECTION_ESTABLISHED`  
**Direction:** Server → Client  
**Trigger:** After authentication and socket handshake.

**Payload:**
```json
{
  "connectionId": "string (UUID)",
  "playerId": "UUID",
  "timestamp": "ISO8601"
}
```

---

### Connection lost
**Event:** `CONNECTION_LOST`  
**Direction:** Server → Client  
**Trigger:** Socket disconnected.

**Payload:**
```json
{
  "reason": "network | timeout | server-shutdown",
  "timestamp": "ISO8601"
}
```

---

## 2. Player Action Commands

### InitiateHack Command
**Command:** `INITIATE_HACK`  
**Direction:** Client → Server  
**Auth:** JWT token required.

**Payload:**
```json
{
  "attackerId": "UUID",
  "targetComputerId": "UUID",
  "hackType": "steal_money | steal_data | install_virus | ddos",
  "toolsUsed": ["tool_id_1", "tool_id_2"]
}
```

**Server Validation:**
- Attacker is authenticated player
- Attacker has enough energy
- Target computer exists and is online
- Attacker doesn't own target computer
- Hack not already in progress against target

**Response (success):**
```
HackOperationStarted event
```

**Response (failure):**
```
ActionRejected event with error code
```

---

### InstallDefense Command
**Command:** `INSTALL_DEFENSE`  
**Direction:** Client → Server

**Payload:**
```json
{
  "computerId": "UUID",
  "defenseType": "firewall | antivirus | honeypot | ids"
}
```

**Server Validation:**
- Player owns computer
- Defense type not already installed
- Player has sufficient funds
- Computer is online

**Response (success):**
```
DefenseInstalled event
```

**Response (failure):**
```
ActionRejected event
```

---

### UpgradeDefense Command
**Command:** `UPGRADE_DEFENSE`  
**Direction:** Client → Server

**Payload:**
```json
{
  "computerId": "UUID",
  "defenseId": "UUID"
}
```

**Server Validation:**
- Player owns computer
- Defense exists and belongs to computer
- Defense level < 5
- Player has sufficient funds

**Response (success):**
```
DefenseUpgraded event
```

**Response (failure):**
```
ActionRejected event
```

---

### ConsumeSkillPoints Command
**Command:** `CONSUME_SKILL_POINTS`  
**Direction:** Client → Server

**Payload:**
```json
{
  "playerId": "UUID",
  "amount": "integer",
  "upgradeType": "string (e.g., 'firewall_tier_2')"
}
```

**Server Validation:**
- Player is authenticated
- Player has sufficient skill points
- Upgrade is valid and not already unlocked

**Response (success):**
```
SkillPointsConsumed event + ProgressionUnlockGranted event
```

**Response (failure):**
```
ActionRejected event
```

---

## 3. Game State Events

### HackOperationStarted
**Event:** `HACK_OPERATION_STARTED`  
**Direction:** Server → Client  
**Broadcast:** To attacker and all players observing target.

**Trigger:** Player initiates hack successfully.

**Payload:**
```json
{
  "operationId": "UUID",
  "attackerId": "UUID",
  "targetComputerId": "UUID",
  "hackType": "string",
  "toolsUsed": ["string"],
  "estimatedDuration": "integer (seconds)",
  "startedAt": "ISO8601",
  "completionAt": "ISO8601"
}
```

---

### HackOperationCompleted
**Event:** `HACK_OPERATION_COMPLETED`  
**Direction:** Server → Client  
**Broadcast:** To attacker and target owner.

**Trigger:** Hack completion time reached (server processes immediately or via scheduled job).

**Payload:**
```json
{
  "operationId": "UUID",
  "attackerId": "UUID",
  "targetComputerId": "UUID",
  "success": "boolean",
  "resourcesStolen": "bigint (if success)",
  "xpGranted": "bigint",
  "detectedByTarget": "boolean",
  "resultData": {
    "successRoll": "integer (0-100)",
    "resourcesStolen": "bigint"
  },
  "timestamp": "ISO8601"
}
```

---

### DefenseInstalled
**Event:** `DEFENSE_INSTALLED`  
**Direction:** Server → Client  
**Broadcast:** To player (private).

**Trigger:** Player installs defense successfully.

**Payload:**
```json
{
  "computerId": "UUID",
  "defenseId": "UUID",
  "defenseType": "string",
  "level": 1,
  "cost": "integer (money deducted)",
  "timestamp": "ISO8601"
}
```

---

### DefenseUpgraded
**Event:** `DEFENSE_UPGRADED`  
**Direction:** Server → Client  
**Broadcast:** To player (private).

**Trigger:** Defense successfully upgraded.

**Payload:**
```json
{
  "computerId": "UUID",
  "defenseId": "UUID",
  "defenseType": "string",
  "oldLevel": "integer",
  "newLevel": "integer",
  "cost": "integer (money deducted)",
  "timestamp": "ISO8601"
}
```

---

### PlayerEnergyUpdated
**Event:** `PLAYER_ENERGY_UPDATED`  
**Direction:** Server → Client  
**Broadcast:** To player (private).

**Trigger:** Player energy changes (consumed by action or regenerated by timer).

**Payload:**
```json
{
  "playerId": "UUID",
  "current": "integer",
  "max": "integer",
  "reason": "hack_consumed | regeneration | upgrade",
  "timestamp": "ISO8601"
}
```

---

### PlayerMoneyUpdated
**Event:** `PLAYER_MONEY_UPDATED`  
**Direction:** Server → Client  
**Broadcast:** To player (private).

**Trigger:** Player money changes (earned from hack, spent on upgrade).

**Payload:**
```json
{
  "playerId": "UUID",
  "amount": "bigint",
  "delta": "bigint (signed)",
  "reason": "hack_success | defense_install | defense_upgrade",
  "timestamp": "ISO8601"
}
```

---

### PlayerExperienceGained
**Event:** `PLAYER_EXPERIENCE_GAINED`  
**Direction:** Server → Client  
**Broadcast:** To player (private).

**Trigger:** Player completes hack successfully.

**Payload:**
```json
{
  "playerId": "UUID",
  "amount": "bigint",
  "totalExperience": "bigint",
  "newLevel": "integer (if level up)",
  "timestamp": "ISO8601"
}
```

---

### PlayerLeveledUp
**Event:** `PLAYER_LEVELED_UP`  
**Direction:** Server → Client  
**Broadcast:** To player (private) and leaderboard subscribers.

**Trigger:** Player experience reaches next threshold.

**Payload:**
```json
{
  "playerId": "UUID",
  "newLevel": "integer",
  "skillPointsGranted": "integer",
  "energyCapacityIncreased": "integer",
  "timestamp": "ISO8601"
}
```

---

### ProgressionUnlockGranted
**Event:** `PROGRESSION_UNLOCK_GRANTED`  
**Direction:** Server → Client  
**Broadcast:** To player (private).

**Trigger:** Player reaches unlock condition (level, skill points, achievement).

**Payload:**
```json
{
  "playerId": "UUID",
  "unlockType": "tool | defense | upgrade | skill",
  "unlockKey": "string",
  "description": "string",
  "timestamp": "ISO8601"
}
```

---

## 4. Error & Rejection Events

### ActionRejected
**Event:** `ACTION_REJECTED`  
**Direction:** Server → Client  
**Broadcast:** To player (private).

**Trigger:** Server rejects invalid command.

**Payload:**
```json
{
  "commandType": "string (original command)",
  "reason": "string",
  "errorCode": "INSUFFICIENT_ENERGY | INSUFFICIENT_FUNDS | TARGET_OFFLINE | DEFENSE_EXISTS | ...",
  "timestamp": "ISO8601"
}
```

---

### ServerNotification
**Event:** `SERVER_NOTIFICATION`  
**Direction:** Server → Client  
**Broadcast:** To affected players.

**Trigger:** Server needs to alert players (maintenance, global event, etc.).

**Payload:**
```json
{
  "type": "alert | warning | info",
  "message": "string",
  "duration": "integer (seconds, optional)",
  "timestamp": "ISO8601"
}
```

---

## 5. Broadcast & Subscription Model

### Broadcast Channels

**Private (player-only):**
- `players:{playerId}` — Personal events (energy, money, level-up)
- `players:{playerId}:hacks` — Hacks they initiated or defend against

**Global (all connected):**
- `global:notifications` — Server alerts
- `global:leaderboard` — Leaderboard updates (debounced)

### Example: Broadcasting Hack Completion

```typescript
// Server processes completed hack
const hack = await hackRepository.findById(operationId);
hack = hack.transition(HackStatus.SUCCEEDED, resultData);

// Emit to attacker
io.to(`players:${hack.getAttackerId()}`).emit('HACK_OPERATION_COMPLETED', {
  operationId: hack.getId(),
  success: true,
  resourcesStolen: resultData.resourcesStolen,
  ...
});

// Emit to target owner (defender)
const target = await computerRepository.findById(hack.getTargetComputerId());
io.to(`players:${target.getOwnerId()}`).emit('HACK_OPERATION_COMPLETED', {
  operationId: hack.getId(),
  attackerDisplayName: attacker.getDisplayName(), // Inform defender
  success: true,
  ...
});

// Emit to leaderboard subscribers (if applicable)
io.to('global:leaderboard').emit('LEADERBOARD_UPDATE', { ... });
```

---

## 6. Event Ordering & Consistency

### Guarantees

- **Server Authority:** All events are generated by the server only.
- **Atomic Transitions:** A command is either fully accepted or fully rejected (no partial updates).
- **Ordered Delivery:** Events for a single player are delivered in order (via socket queue).
- **Timestamp Truth:** Server timestamp is the source of truth for event ordering.

### Example: Safe Hack Completion

```typescript
// Atomically:
// 1. Update hack status
// 2. Transfer resources
// 3. Grant XP
// 4. Check for level-up
// 5. Emit all resulting events

const transactionResult = await hackOperationService.executeHack(operationId);

// transactionResult.events = [
//   HackOperationCompletedEvent,
//   PlayerMoneyUpdatedEvent (attacker),
//   PlayerExperienceGainedEvent (attacker),
//   PlayerLeveledUpEvent (if applicable),
//   PlayerEnergyUpdatedEvent (defender, if notified),
// ]

transactionResult.events.forEach(event => {
  broadcastToAffectedPlayers(event);
});
```

---

## 7. Client Reconnection & Replay

When a client reconnects after disconnect:

1. Client sends `RECONNECT` with last known timestamp
2. Server identifies missed events
3. Server sends **state snapshot** + **delta events** since disconnect
4. Client reconciles local state with server state

**State Snapshot Example:**
```json
{
  "type": "STATE_SNAPSHOT",
  "player": { /* full player state */ },
  "computers": [ /* full computer array */ ],
  "activeHacks": [ /* ongoing hack operations */ ],
  "timestamp": "ISO8601"
}
```
