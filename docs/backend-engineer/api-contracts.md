/**
 * Backend Engineer - API Contracts Documentation
 *
 * This document defines all HTTP APIs for the NetWatch backend.
 * All endpoints are server-authoritative and require client trust validation.
 *
 * Contract-first principle: Backend defines structure; frontend consumes.
 */

# API Contracts

## 1. Authentication APIs

### Register User
**Endpoint:** `POST /auth/register`  
**Purpose:** Create a new user account.

**Request:**
```json
{
  "username": "string (3-20 chars)",
  "password": "string (8+ chars, uppercase, lowercase, digit)",
  "email": "string (optional, valid email format)"
}
```

**Response (201):**
```json
{
  "userId": "UUID",
  "username": "string",
  "email": "string | null",
  "createdAt": "ISO8601"
}
```

**Errors:**
- `400`: Username taken, invalid password, invalid email format
- `409`: Account already exists

---

### Login
**Endpoint:** `POST /auth/login`  
**Purpose:** Authenticate and receive JWT token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "accessToken": "JWT",
  "refreshToken": "JWT (optional)",
  "expiresIn": 3600
}
```

**Errors:**
- `401`: Invalid credentials
- `403`: Account suspended

---

### Refresh Token
**Endpoint:** `POST /auth/refresh`  
**Purpose:** Obtain new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "JWT"
}
```

**Response (200):**
```json
{
  "accessToken": "JWT",
  "expiresIn": 3600
}
```

**Errors:**
- `401`: Invalid or expired refresh token

---

## 2. Player APIs

### Create Player Character
**Endpoint:** `POST /players`  
**Auth:** Required (JWT)  
**Purpose:** Create a game character for the authenticated user.

**Request:**
```json
{
  "displayName": "string (1-50 chars)"
}
```

**Response (201):**
```json
{
  "playerId": "UUID",
  "userId": "UUID",
  "displayName": "string",
  "level": "integer",
  "experience": "bigint",
  "energy": {
    "current": "integer",
    "max": "integer"
  },
  "money": "bigint",
  "skillPoints": "integer",
  "createdAt": "ISO8601"
}
```

**Errors:**
- `400`: Invalid display name
- `409`: Player already exists for user
- `401`: Unauthorized

---

### Get Player Profile
**Endpoint:** `GET /players/:playerId`  
**Auth:** Required  
**Purpose:** Fetch player state.

**Response (200):**
```json
{
  "playerId": "UUID",
  "displayName": "string",
  "level": "integer",
  "experience": "bigint",
  "energy": {
    "current": "integer",
    "max": "integer"
  },
  "money": "bigint",
  "skillPoints": "integer",
  "computers": [
    {
      "computerId": "UUID",
      "name": "string",
      "ipAddress": "string",
      "isOnline": "boolean",
      "firewallLevel": "integer",
      "defenses": [
        {
          "defenseId": "UUID",
          "type": "firewall | antivirus | honeypot | ids",
          "level": "integer"
        }
      ]
    }
  ],
  "unlocks": [
    {
      "unlockId": "UUID",
      "type": "tool | defense | upgrade | skill",
      "key": "string",
      "unlockedAt": "ISO8601"
    }
  ]
}
```

**Errors:**
- `404`: Player not found
- `401`: Unauthorized

---

## 3. Computer APIs

### Create Computer
**Endpoint:** `POST /players/:playerId/computers`  
**Auth:** Required  
**Purpose:** Create a new computer owned by player.

**Request:**
```json
{
  "name": "string (1-50 chars)",
  "ipAddress": "string (auto-generated if omitted)"
}
```

**Response (201):**
```json
{
  "computerId": "UUID",
  "name": "string",
  "ipAddress": "string",
  "storage": "integer",
  "cpu": "integer",
  "memory": "integer",
  "isOnline": "boolean",
  "firewallLevel": "integer",
  "createdAt": "ISO8601"
}
```

**Errors:**
- `400`: Invalid name, IP already taken
- `404`: Player not found
- `401`: Unauthorized (can only create own computers)

---

### List Player Computers
**Endpoint:** `GET /players/:playerId/computers`  
**Auth:** Required  
**Purpose:** List all computers owned by player.

**Response (200):**
```json
[
  {
    "computerId": "UUID",
    "name": "string",
    "ipAddress": "string",
    "isOnline": "boolean",
    "firewallLevel": "integer",
    "storage": "integer",
    "cpu": "integer",
    "memory": "integer"
  }
]
```

---

### Get Computer Details
**Endpoint:** `GET /computers/:computerId`  
**Auth:** Required  
**Purpose:** Get full computer state including defenses.

**Response (200):**
```json
{
  "computerId": "UUID",
  "name": "string",
  "ipAddress": "string",
  "ownerId": "UUID",
  "isOnline": "boolean",
  "firewallLevel": "integer",
  "storage": "integer",
  "cpu": "integer",
  "memory": "integer",
  "defenses": [
    {
      "defenseId": "UUID",
      "type": "firewall | antivirus | honeypot | ids",
      "level": "integer",
      "installedAt": "ISO8601"
    }
  ],
  "createdAt": "ISO8601"
}
```

---

## 4. Hack APIs

### Initiate Hack
**Endpoint:** `POST /hacks`  
**Auth:** Required  
**Purpose:** Start a hacking operation.

**Request:**
```json
{
  "attackerId": "UUID",
  "targetComputerId": "UUID",
  "hackType": "steal_money | steal_data | install_virus | ddos",
  "toolsUsed": ["tool_id_1", "tool_id_2"]
}
```

**Response (201):**
```json
{
  "operationId": "UUID",
  "attackerId": "UUID",
  "targetComputerId": "UUID",
  "status": "pending",
  "hackType": "string",
  "toolsUsed": ["string"],
  "estimatedDuration": "integer (seconds)",
  "startedAt": "ISO8601",
  "completionAt": "ISO8601"
}
```

**Errors:**
- `400`: Invalid hack parameters (e.g., insufficient energy, hacking own computer)
- `404`: Computer not found
- `422`: Target offline or already under attack
- `401`: Unauthorized

---

### Get Hack Status
**Endpoint:** `GET /hacks/:operationId`  
**Auth:** Required  
**Purpose:** Fetch operation status and result (if complete).

**Response (200):**
```json
{
  "operationId": "UUID",
  "attackerId": "UUID",
  "targetComputerId": "UUID",
  "status": "pending | in_progress | succeeded | failed | aborted",
  "hackType": "string",
  "toolsUsed": ["string"],
  "estimatedDuration": "integer",
  "startedAt": "ISO8601",
  "completionAt": "ISO8601",
  "resultData": {
    "success": "boolean",
    "resourcesStolen": "bigint",
    "xpGranted": "bigint",
    "detectedByTarget": "boolean"
  }
}
```

**Errors:**
- `404`: Operation not found
- `401`: Unauthorized (must be attacker or target owner)

---

### List Active Hacks by Player
**Endpoint:** `GET /players/:playerId/hacks`  
**Auth:** Required  
**Purpose:** List hacks initiated by or against player.

**Query Params:**
- `role`: "attacker" | "defender" (filter hacks)
- `status`: "pending" | "in_progress" | "succeeded" | "failed" | "aborted"

**Response (200):**
```json
[
  {
    "operationId": "UUID",
    "attackerId": "UUID",
    "targetComputerId": "UUID",
    "status": "string",
    "hackType": "string",
    "startedAt": "ISO8601",
    "completionAt": "ISO8601"
  }
]
```

---

## 5. Defense APIs

### Install Defense
**Endpoint:** `POST /computers/:computerId/defenses`  
**Auth:** Required  
**Purpose:** Install security software on computer.

**Request:**
```json
{
  "defenseType": "firewall | antivirus | honeypot | ids"
}
```

**Response (201):**
```json
{
  "defenseId": "UUID",
  "computerId": "UUID",
  "defenseType": "string",
  "level": 1,
  "installedAt": "ISO8601"
}
```

**Errors:**
- `400`: Defense already installed on computer, insufficient funds
- `404`: Computer not found
- `401`: Unauthorized (must own computer)

---

### Upgrade Defense
**Endpoint:** `POST /computers/:computerId/defenses/:defenseId/upgrade`  
**Auth:** Required  
**Purpose:** Upgrade installed defense to next level.

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "defenseId": "UUID",
  "computerId": "UUID",
  "defenseType": "string",
  "level": "integer (2-5)",
  "installedAt": "ISO8601"
}
```

**Errors:**
- `400`: Defense at max level, insufficient funds
- `404`: Defense not found
- `401`: Unauthorized

---

### List Computer Defenses
**Endpoint:** `GET /computers/:computerId/defenses`  
**Auth:** Required  
**Purpose:** List all installed defenses.

**Response (200):**
```json
[
  {
    "defenseId": "UUID",
    "defenseType": "string",
    "level": "integer",
    "effectiveness": "integer (0-100)",
    "installedAt": "ISO8601"
  }
]
```

---

## 6. Progression APIs

### Get Player Unlocks
**Endpoint:** `GET /players/:playerId/unlocks`  
**Auth:** Required  
**Purpose:** List all progression unlocks for player.

**Response (200):**
```json
[
  {
    "unlockId": "UUID",
    "unlockType": "tool | defense | upgrade | skill",
    "unlockKey": "string",
    "unlockedAt": "ISO8601"
  }
]
```

---

### Check Unlock Status
**Endpoint:** `GET /players/:playerId/unlocks/:unlockKey`  
**Auth:** Required  
**Purpose:** Verify if player has specific unlock.

**Response (200):**
```json
{
  "hasUnlock": "boolean",
  "unlockedAt": "ISO8601 | null"
}
```

---

## Error Response Format

All errors follow this standard format:

```json
{
  "statusCode": "integer",
  "message": "string",
  "error": "error_code",
  "timestamp": "ISO8601"
}
```

**Common Error Codes:**
- `INVALID_INPUT`: Request validation failed
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Authenticated but not permitted
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., duplicate)
- `UNPROCESSABLE_ENTITY`: Business rule violation
- `INTERNAL_SERVER_ERROR`: Server error

---

## Authentication & Authorization

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT>
```

**Token Claims:**
```json
{
  "sub": "userId",
  "username": "string",
  "iat": "timestamp",
  "exp": "timestamp"
}
```

**Server Authority:**
- All requests are server-validated.
- Client cannot modify token; server re-validates on each request.
- Player can only access/modify own resources.
