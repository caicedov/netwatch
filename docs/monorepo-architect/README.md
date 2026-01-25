# Archived

This file has been superseded. Use the canonical monorepo navigation in [docs/INDEX.md](../INDEX.md) and the living guides:
- [monorepo-architect/START-HERE.md](START-HERE.md)
- [monorepo-architect/SUMMARY.md](SUMMARY.md)
- [monorepo-architect/structure.md](structure.md)
- [monorepo-architect/conventions.md](conventions.md)
- [monorepo-architect/turborepo-pipelines.md](turborepo-pipelines.md)
| **TypeScript everywhere**    | Type-safe across backend and frontend             | No JavaScript files in source                |
| **Monolith (backend)**       | Simplicity, shared domain context, fast iteration | Modules communicate via dependency injection |
| **Modular structure**        | Supports independent feature development          | Respect module boundaries                    |
| **No implicit dependencies** | Prevents coupling and circular imports            | Always declare what you import               |

---

## Success Criteria

If these are true, the monorepo is working:

- [ ] Backend engineer can implement a feature without restructuring folders
- [ ] Frontend engineer can consume contracts without understanding backend internals
- [ ] Database architect can map schemas to modules without guessing where code lives
- [ ] A new developer can read the docs and understand the codebase in 30 minutes
- [ ] Local development works with `pnpm dev` (backend + frontend together)
- [ ] Tests run in under 30 seconds (cached)
- [ ] No file imports from both `apps/backend` and `apps/frontend`

If any of these is false, file an issue. The monorepo is not doing its job.

---

## Key Documents

- **[structure.md](structure.md)** — Folder layout, package responsibilities, dependency graph
- **[turborepo-pipelines.md](turborepo-pipelines.md)** — Build tasks, caching, local workflow
- **[conventions.md](conventions.md)** — Naming, imports, database rules, shared code rules

---

## References

- **Domain Model:** `/docs/software-architect/domain-model.md`
- **Database Schema:** `/docs/database-architect/schema-design.md`
- **Architecture Overview:** `/docs/software-architect/architecture-overview.md`
- **MVP Scope:** `/docs/product-owner/mvp-scope.md`
