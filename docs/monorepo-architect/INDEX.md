# Archived

This index has been replaced by the consolidated table of contents in [docs/INDEX.md](../INDEX.md). Use START-HERE, SUMMARY, structure, conventions, and turborepo-pipelines from that index for navigation.

Read [SUMMARY.md](SUMMARY.md)

- One-page architecture overview
- Dependency flow diagram
- Key decisions and rationale
- File naming quick reference

---

## Document Overview

| Document                                         | Purpose                                   | Audience          | Read Time |
| ------------------------------------------------ | ----------------------------------------- | ----------------- | --------- |
| [README.md](README.md)                           | Quick start guide per role                | All               | 5 min     |
| [SUMMARY.md](SUMMARY.md)                         | One-page architecture overview            | All               | 10 min    |
| [structure.md](structure.md)                     | Folder layout, packages, persistence      | Backend, Database | 20 min    |
| [turborepo-pipelines.md](turborepo-pipelines.md) | Build tasks, local workflow               | All               | 15 min    |
| [conventions.md](conventions.md)                 | Naming, imports, database rules           | All               | 20 min    |
| [CHECKLIST.md](CHECKLIST.md)                     | Verification and implementation checklist | All               | 30 min    |
| **This file**                                    | Navigation guide                          | All               | 5 min     |

**Total reading time:** ~60 minutes for complete understanding.

---

## Quick Links by Common Questions

**"Where do I put X?"**

- Repository → [structure.md - Persistence Layer Location](structure.md#persistence-layer-location)
- Component → [conventions.md - Frontend Component Organization](conventions.md#frontend-component-organization)
- Module → [structure.md - Backend Module Structure](structure.md#backend-module-structure)
- Shared code → [conventions.md - Shared Code Rules](conventions.md#shared-code-rules)
- Domain model → [SUMMARY.md - Database Mapping](SUMMARY.md#database-mapping-quick-reference)

**"Can I import X from Y?"**

- [conventions.md - Import Rules](conventions.md#import-rules) has full rules
- [SUMMARY.md - Import Rules at a Glance](SUMMARY.md#import-rules-at-a-glance) for quick answer

**"How do I name this file?"**

- [conventions.md - Naming Conventions](conventions.md#naming-conventions)
- [SUMMARY.md - File Naming Quick Reference](SUMMARY.md#file-naming-quick-reference)

**"How do I run X?"**

- [turborepo-pipelines.md - Task Definitions by Scope](turborepo-pipelines.md#task-definitions-by-scope)
- [SUMMARY.md - Turborepo Task Reference](SUMMARY.md#turborepo-task-reference)

**"Is the monorepo set up correctly?"**

- [CHECKLIST.md](CHECKLIST.md) — Follow the phases to verify

**"What can the database architect do now?"**

- [structure.md - Persistence Layer Location](structure.md#persistence-layer-location) defines the contract

---

## Document Tree (for reference)

```
docs/monorepo-architect/
├── README.md              (Quick start per role)
├── SUMMARY.md             (One-page overview)
├── INDEX.md               (This file - navigation)
├── CHECKLIST.md           (Implementation verification)
├── structure.md           (Folder layout, packages, persistence)
├── turborepo-pipelines.md (Build tasks, local workflow)
└── conventions.md         (Naming, imports, database rules)
```

---

## How to Use This Index

1. **Find your role** (Backend, Database, Frontend, or Any)
2. **Follow the "Start here" link**
3. **Read the "Essential readings" in order**
4. **Reference the specific sections as needed**
5. **Check the "Quick Links" section when in doubt**

If you can't find what you're looking for, use this index to navigate. If the index doesn't have your question, the monorepo design is incomplete.

---

## Version

- Created: January 22, 2026
- Last Updated: January 22, 2026
- Status: Active (used for all development)

---

**Need help?** Read [README.md](README.md) for role-specific guidance, then reference this index to find the section you need.
