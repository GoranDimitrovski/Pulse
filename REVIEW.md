# PR review instructions (Pulse)

Review for correctness and this project's specific invariants — not style. CI already runs
ESLint, Prettier, and `tsc --noEmit`; don't repeat their findings.

## Always check, and flag as blocking if violated

- **Tenant isolation.** Any new or changed repository method that reads/writes tenant data
  must take `tenantId` as an explicit parameter. Any new or changed HTTP route must derive
  `tenantId` from `request.authUser!.tenantId` — never from the request body, URL param, or
  query string, even as a fallback. A route accepting a client-supplied `tenantId` in its Zod
  body schema is a security bug, not a style nit.
- **Cross-tenant test coverage.** A new tenant-scoped route (anything under `/api/targets`,
  `/api/alert-channels`, `/api/api-keys`, or similar) needs an integration test asserting a
  second tenant gets `404` (not `403`) when trying to read/modify the first tenant's resource.
  If the PR adds such a route without that test, flag it as missing test coverage.
- **Layering.** `src/domain/` must not import from `src/application/` or
  `src/infrastructure/`. `src/application/` must not import a concrete class from
  `src/infrastructure/` (only port interfaces). A use case constructing a
  `DrizzleXRepository` or a Fastify type directly is a layering violation.
- **Migrations.** A new file under `drizzle/*.sql` should look machine-generated (via
  `drizzle-kit generate`), not hand-written — flag hand-edited migration SQL. Flag any
  `DROP TABLE`/`DROP COLUMN`/`TRUNCATE`/type-narrowing `ALTER COLUMN` without an accompanying
  data-migration step or an explanation in the PR description of why the data loss is intended.
- **Frontend API access.** A Vue component or composable calling `fetch()` directly instead
  of going through `web/src/lib/api.ts`'s `api` object should be flagged — it bypasses the
  401→refresh retry logic and produces an inconsistent error shape.
- **Secrets.** Flag any hardcoded credential, API key, or connection string that should come
  from `src/shared/config/env.ts` (Zod-validated env) instead.

## Don't flag

- Formatting/lint-level issues — CI's ESLint/Prettier/`tsc` already gate these
- Missing JSDoc/comments on self-explanatory code (this project's convention is comments only
  for non-obvious *why*, not *what* — see `CLAUDE.md`)
- Naming preferences that don't affect correctness
- Anything in `drizzle/meta/` (generated snapshots, not meant to be hand-readable)

## Cap the nits

At most 5 non-blocking suggestions per review. If you have more than that, they're probably
not worth raising — pick the 5 that matter most.

## Known gap

There is currently no frontend test suite (`web/` has no Vitest setup). Don't flag "missing
frontend tests" as a PR-specific issue unless the PR claims to add frontend testing
infrastructure — it's a pre-existing gap, not something introduced by any one PR.
