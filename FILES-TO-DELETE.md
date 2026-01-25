# Files to Delete After Migration Testing

⚠️ **IMPORTANT**: Only delete these files AFTER you have:
1. Successfully installed Prisma dependencies
2. Generated Prisma Client
3. Tested all API endpoints
4. Verified all database operations work correctly

## TypeORM Entity Files (Delete Entire Directory)
```
apps\backend\src\infrastructure\database\entities\
├── computer.entity.ts
├── defense.entity.ts
├── hack-operation.entity.ts
├── player.entity.ts
├── progression-unlock.entity.ts
└── user.entity.ts
```

## TypeORM Migration Files (Delete Entire Directory)
```
apps\backend\src\infrastructure\database\migrations\
└── 1737648000000-InitialSchema.ts
```

## TypeORM Configuration Files
```
apps\backend\src\infrastructure\database\data-source.ts
apps\backend\src\infrastructure\database\connection.ts (if exists)
```

## Batch Delete Commands

### Windows Command Prompt
```batch
cd apps\backend\src\infrastructure\database
rmdir /s /q entities
rmdir /s /q migrations
del data-source.ts
del connection.ts
```

### Windows PowerShell
```powershell
cd apps\backend\src\infrastructure\database
Remove-Item -Path entities -Recurse -Force
Remove-Item -Path migrations -Recurse -Force
Remove-Item -Path data-source.ts -Force
Remove-Item -Path connection.ts -Force -ErrorAction SilentlyContinue
```

### Git Bash / WSL
```bash
cd apps/backend/src/infrastructure/database
rm -rf entities/
rm -rf migrations/
rm -f data-source.ts
rm -f connection.ts
```

## Verification Checklist

Before deleting, verify:

- [ ] Application starts without errors
- [ ] User registration works
- [ ] User login works
- [ ] Player creation works
- [ ] Computer CRUD operations work
- [ ] Defense installation works
- [ ] Hack operations can be created and executed
- [ ] Progression unlocks can be created
- [ ] All unit tests pass (`pnpm test`)
- [ ] All e2e tests pass (`pnpm test:e2e`)
- [ ] No TypeORM imports remain in codebase

## Search for Remaining TypeORM References

Run these commands to ensure no TypeORM code remains:

```bash
# Search for TypeORM imports
grep -r "from 'typeorm'" apps/backend/src/

# Search for TypeORM decorators
grep -r "@Entity\\|@Column\\|@ManyToOne\\|@OneToMany\\|@JoinColumn" apps/backend/src/

# Search for TypeORM Repository usage
grep -r "Repository<" apps/backend/src/

# Search for DataSource usage
grep -r "DataSource" apps/backend/src/
```

All of these should return **no results** (except in comments/documentation).

## After Deletion

1. Commit the changes:
```bash
git add .
git commit -m "feat: migrate from TypeORM to Prisma ORM"
```

2. Update documentation:
   - README.md
   - Architecture diagrams
   - Developer onboarding guides
   - API documentation

3. Inform the team about:
   - New Prisma scripts available
   - Prisma Studio for database inspection
   - Changed migration workflow
   - Updated development workflow

## Rollback (If Needed)

If you need to rollback BEFORE deleting:

```bash
# Restore all changes
git checkout HEAD -- apps/backend/

# Reinstall dependencies
cd apps/backend
pnpm install
```

If you need to rollback AFTER deleting (and committed):

```bash
# Revert the commit
git revert HEAD

# Or reset to previous commit (destructive)
git reset --hard HEAD~1
```

## Keep These Files

✅ DO NOT DELETE:
- `apps\backend\src\infrastructure\database\database.module.ts` (Updated for Prisma)
- `apps\backend\src\infrastructure\database\prisma.service.ts` (New Prisma service)
- `apps\backend\prisma\schema.prisma` (Prisma schema)
- All repository files (Updated for Prisma)
- All mapper files (Updated for Prisma)

---

**Last Updated**: January 25, 2026
**Migration Status**: Code updated, awaiting testing before cleanup
