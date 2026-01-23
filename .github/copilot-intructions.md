# Copilot Instructions (Repository)

- USE ALWAYS ENGLISH.

## Git commits

- Always suggest commit messages using conventional commits.
- Use format: <type>(<scope>): <summary>
- Allowed types: feat, fix, chore, docs, refactor, test, build, ci, perf, style
- Always prefer imperative mood in summary.
- Provide 1 primary commit + 2 alternatives
- If breaking change, include "!" after type or scope, and add footer: BREAKING CHANGE: ...
- If scope is unclear, infer it from changed module/folder.

## Git workflow

- Branch naming feature/<scope>-<short>, fix/<scope>-<short>, chore/<scope>-<short>.

## Pull Request

- Always generate PR summaries with:
  - Context
  - What changed
  - How to test
  - Risks/rollback
- Include checklist:
  - [ ] Tests added/updated
  - [ ] Lint passes
  - [ ] No secrets logged
