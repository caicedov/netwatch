# TypeORM to Prisma Migration Guide

## Migration Completed ✅

The NetWatch backend has been successfully migrated from TypeORM to Prisma ORM. All repository implementations, mappers, and database modules have been updated.

## What Was Changed

### 1. Package Dependencies
- **Removed**: `typeorm`, `@nestjs/typeorm`, `pg`
- **Added**: `@prisma/client`, `prisma` (dev dependency)

### 2. Updated Files
- `apps/backend/package.json` - Updated dependencies and scripts
- `apps/backend/src/infrastructure/database/database.module.ts` - Now uses PrismaService
- `apps/backend/src/infrastructure/database/prisma.service.ts` - **NEW** Prisma client service
- All repository files (6 repositories updated):
  - `user.repository.ts`
  - `player.repository.ts`
  - `computer.repository.ts`
  - `defense.repository.ts`
  - `hack-operation.repository.ts`
  - `progression-unlock.repository.ts`
- All mapper files (6 mappers updated):
  - `user.mapper.ts`
  - `player.mapper.ts`
  - `computer.mapper.ts`
  - `defense.mapper.ts`
  - `hack-operation.mapper.ts`
  - `progression-unlock.mapper.ts`

### 3. Files to Delete (TypeORM artifacts)
```
apps/backend/src/infrastructure/database/entities/
apps/backend/src/infrastructure/database/migrations/
apps/backend/src/infrastructure/database/data-source.ts
apps/backend/src/infrastructure/database/connection.ts (if exists)
```

## Setup Instructions

### Step 1: Create Prisma Directory and Schema

**IMPORTANT**: PowerShell 6+ is required but not installed on your system. You need to manually create the Prisma directory and schema file.

1. Create directory: `apps\backend\prisma\`

2. Create file: `apps\backend\prisma\schema.prisma` with the following content:

```prisma
// Prisma Schema for NetWatch Game Backend
// This schema represents the complete database structure for the game

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User authentication and account management
model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  username      String    @unique @db.VarChar(20)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  email         String?   @unique @db.VarChar(255)
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  lastLoginAt   DateTime? @map("last_login_at") @db.Timestamptz(6)

  // Relations
  player Player?

  @@index([email], map: "idx_users_email")
  @@index([createdAt], map: "idx_users_created")
  @@map("users")
}

// Player game state and resources
model Player {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String   @unique @map("user_id") @db.Uuid
  displayName  String   @map("display_name") @db.VarChar(50)
  energy       Int      @default(100)
  energyMax    Int      @default(100) @map("energy_max")
  money        BigInt   @default(0)
  experience   BigInt   @default(0)
  level        Int?     @default(0)
  skillPoints  Int      @default(0) @map("skill_points")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relations
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  computers         Computer[]
  hackOperations    HackOperation[]
  progressionUnlocks ProgressionUnlock[]

  @@index([userId], map: "idx_players_user")
  @@index([level], map: "idx_players_level")
  @@index([createdAt], map: "idx_players_created")
  @@map("players")
}

// Computer owned by players
model Computer {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ownerId       String   @map("owner_id") @db.Uuid
  name          String   @db.VarChar(50)
  ipAddress     String   @unique @map("ip_address") @db.VarChar(15)
  storage       Int      @default(1000)
  cpu           Int      @default(100)
  memory        Int      @default(512)
  isOnline      Boolean  @default(true) @map("is_online")
  firewallLevel Int      @default(0) @map("firewall_level")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  // Relations
  owner          Player          @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  defenses       Defense[]
  hackOperations HackOperation[]

  @@index([ownerId], map: "idx_computers_owner")
  @@index([ipAddress], map: "idx_computers_ip")
  @@index([isOnline], map: "idx_computers_online")
  @@map("computers")
}

// Defense systems installed on computers
model Defense {
  id           String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  computerId   String      @map("computer_id") @db.Uuid
  defenseType  DefenseType @map("defense_type")
  level        Int         @default(1)
  effectiveness Decimal    @default(1.0) @db.Decimal(5, 2)
  installedAt  DateTime    @default(now()) @map("installed_at") @db.Timestamptz(6)

  // Relations
  computer Computer @relation(fields: [computerId], references: [id], onDelete: Cascade)

  @@unique([computerId, defenseType], map: "unique_defense_per_computer")
  @@index([computerId], map: "idx_defenses_computer")
  @@map("defenses")
}

// Hacking operations between players
model HackOperation {
  id                String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  attackerId        String     @map("attacker_id") @db.Uuid
  targetComputerId  String     @map("target_computer_id") @db.Uuid
  status            HackStatus @default(PENDING)
  hackType          HackType   @map("hack_type")
  toolsUsed         Json       @default("[]") @map("tools_used") @db.JsonB
  estimatedDuration Int        @map("estimated_duration")
  startedAt         DateTime   @default(now()) @map("started_at") @db.Timestamptz(6)
  completionAt      DateTime   @map("completion_at") @db.Timestamptz(6)
  resultData        Json?      @map("result_data") @db.JsonB

  // Relations
  attacker       Player   @relation(fields: [attackerId], references: [id], onDelete: Cascade)
  targetComputer Computer @relation(fields: [targetComputerId], references: [id], onDelete: Cascade)

  @@index([attackerId], map: "idx_hack_attacker")
  @@index([targetComputerId], map: "idx_hack_target")
  @@index([status], map: "idx_hack_status")
  @@index([completionAt], map: "idx_hack_pending")
  @@map("hack_operations")
}

// Player progression unlocks (tools, skills, upgrades)
model ProgressionUnlock {
  id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  playerId   String     @map("player_id") @db.Uuid
  unlockType UnlockType @map("unlock_type")
  unlockKey  String     @map("unlock_key") @db.VarChar(50)
  unlockedAt DateTime   @default(now()) @map("unlocked_at") @db.Timestamptz(6)

  // Relations
  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([playerId, unlockKey], map: "unique_player_unlock")
  @@index([playerId], map: "idx_unlocks_player")
  @@index([unlockKey], map: "idx_unlocks_key")
  @@map("progression_unlocks")
}

// Enums
enum DefenseType {
  FIREWALL  @map("firewall")
  ANTIVIRUS @map("antivirus")
  HONEYPOT  @map("honeypot")
  IDS       @map("ids")

  @@map("defense_type")
}

enum HackStatus {
  PENDING     @map("pending")
  IN_PROGRESS @map("in_progress")
  SUCCEEDED   @map("succeeded")
  FAILED      @map("failed")
  ABORTED     @map("aborted")

  @@map("hack_status")
}

enum HackType {
  STEAL_MONEY    @map("steal_money")
  STEAL_DATA     @map("steal_data")
  INSTALL_VIRUS  @map("install_virus")
  DDOS           @map("ddos")

  @@map("hack_type")
}

enum UnlockType {
  TOOL    @map("tool")
  DEFENSE @map("defense")
  UPGRADE @map("upgrade")
  SKILL   @map("skill")

  @@map("unlock_type")
}
```

### Step 2: Update Environment Variables

Update your `.env` file to use the Prisma `DATABASE_URL` format:

```env
# Replace individual DB_ variables with a single DATABASE_URL
DATABASE_URL="postgresql://netwatch_user:netwatch_dev_password@localhost:5432/netwatch_dev?schema=public"

# Keep these for backward compatibility if needed
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=netwatch_user
DB_PASSWORD=netwatch_dev_password
DB_NAME=netwatch_dev
```

### Step 3: Install Dependencies

```bash
cd apps/backend
pnpm install
```

### Step 4: Generate Prisma Client

```bash
pnpm prisma:generate
```

### Step 5: Introspect Existing Database (Optional)

If you want Prisma to validate against your existing database:

```bash
pnpm prisma db pull
```

### Step 6: Create Initial Migration

Since your database already exists with TypeORM migrations, you need to baseline it:

```bash
# Create a baseline migration
pnpm prisma migrate dev --name initial_migration --create-only

# Mark it as applied (since schema already exists)
pnpm prisma migrate resolve --applied initial_migration
```

### Step 7: Delete Old TypeORM Files

After confirming everything works:

```bash
# Delete TypeORM entities directory
rm -rf src/infrastructure/database/entities

# Delete TypeORM migrations directory  
rm -rf src/infrastructure/database/migrations

# Delete TypeORM data source file
rm src/infrastructure/database/data-source.ts

# Delete connection file if it exists
rm src/infrastructure/database/connection.ts 2>/dev/null || true
```

## New Prisma Scripts

The following scripts are now available in `package.json`:

- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:migrate` - Create and apply migrations (dev)
- `pnpm prisma:migrate:deploy` - Apply migrations (production)
- `pnpm prisma:studio` - Open Prisma Studio (database GUI)
- `pnpm prisma:seed` - Run database seeding (if seed file exists)

## Key Differences

### TypeORM vs Prisma Syntax

**TypeORM:**
```typescript
const user = await repository.findOne({ where: { id } });
await repository.save(entity);
await repository.update({ id }, data);
```

**Prisma:**
```typescript
const user = await prisma.user.findUnique({ where: { id } });
await prisma.user.create({ data: entity });
await prisma.user.update({ where: { id }, data });
```

### Relations

**TypeORM:**
```typescript
const computer = await repository.findOne({
  where: { id },
  relations: ['defenses'],
});
```

**Prisma:**
```typescript
const computer = await prisma.computer.findUnique({
  where: { id },
  include: { defenses: true },
});
```

## Benefits of Prisma

1. **Type Safety**: Full end-to-end type safety with auto-generated types
2. **Better DX**: Intuitive API and excellent VS Code integration
3. **Prisma Studio**: Built-in database GUI for development
4. **Migrations**: Declarative migrations that are easier to manage
5. **Performance**: Optimized queries and connection pooling
6. **Modern**: Active development and growing ecosystem

## Troubleshooting

### Issue: Prisma Client not found
**Solution**: Run `pnpm prisma:generate`

### Issue: Schema out of sync
**Solution**: Run `pnpm prisma migrate dev`

### Issue: Migration errors
**Solution**: Check DATABASE_URL format and database connectivity

### Issue: Type errors after migration
**Solution**: Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P > "Restart TS Server")

## Testing

After migration, run your test suite:

```bash
pnpm test
pnpm test:e2e
```

## Rollback Plan

If you need to rollback:
1. Restore `package.json` from git: `git checkout HEAD -- apps/backend/package.json`
2. Restore all repository files from git
3. Run `pnpm install` to reinstall TypeORM
4. Delete Prisma directory and generated client

## Next Steps

1. ✅ Install PowerShell 6+ from https://aka.ms/powershell (recommended)
2. ✅ Create the Prisma schema file as instructed above
3. ✅ Run `pnpm install` to install Prisma
4. ✅ Run `pnpm prisma:generate` to generate the client
5. ✅ Test the application thoroughly
6. ✅ Delete old TypeORM files once confirmed working
7. ✅ Update documentation to reference Prisma instead of TypeORM

## Documentation Updates Needed

- Update README.md with Prisma setup instructions
- Update architecture docs to reference Prisma
- Update developer onboarding guides
