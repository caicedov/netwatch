@echo off
REM TypeORM to Prisma Migration Setup Script
REM Run this script to complete the migration setup

echo ========================================
echo TypeORM to Prisma Migration Setup
echo ========================================
echo.

REM Step 1: Create Prisma directory
echo [1/6] Creating Prisma directory...
if not exist "apps\backend\prisma" (
    mkdir "apps\backend\prisma"
    echo ✓ Created apps\backend\prisma directory
) else (
    echo ✓ Prisma directory already exists
)
echo.

REM Step 2: Copy schema file
echo [2/6] Setting up Prisma schema...
if exist "schema.prisma.txt" (
    copy "schema.prisma.txt" "apps\backend\prisma\schema.prisma"
    echo ✓ Copied schema.prisma to apps\backend\prisma\
) else (
    echo ✗ schema.prisma.txt not found in root directory
    echo   Please manually copy the schema from PRISMA-MIGRATION-GUIDE.md
)
echo.

REM Step 3: Check for .env file
echo [3/6] Checking environment configuration...
if exist "apps\backend\.env" (
    echo ✓ .env file exists
    echo   Please ensure it contains: DATABASE_URL="postgresql://user:pass@localhost:5432/db"
) else (
    echo ! .env file not found
    echo   Creating .env.example...
    echo DATABASE_URL="postgresql://netwatch_user:netwatch_dev_password@localhost:5432/netwatch_dev?schema=public" > "apps\backend\.env.example"
    echo   Please copy .env.example to .env and update with your credentials
)
echo.

REM Step 4: Install dependencies
echo [4/6] Installing dependencies...
echo   Running: cd apps\backend ^&^& pnpm install
cd apps\backend
call pnpm install
cd ..\..
echo.

REM Step 5: Generate Prisma Client
echo [5/6] Generating Prisma Client...
echo   Running: cd apps\backend ^&^& pnpm prisma:generate
cd apps\backend
call pnpm prisma:generate
cd ..\..
echo.

REM Step 6: Summary
echo [6/6] Migration setup complete!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Update your .env file with DATABASE_URL
echo 2. Run: cd apps\backend ^&^& pnpm dev
echo 3. Test all endpoints thoroughly
echo 4. Delete old TypeORM files:
echo    - apps\backend\src\infrastructure\database\entities
echo    - apps\backend\src\infrastructure\database\migrations  
echo    - apps\backend\src\infrastructure\database\data-source.ts
echo.
echo For detailed instructions, see PRISMA-MIGRATION-GUIDE.md
echo ========================================
echo.

pause
