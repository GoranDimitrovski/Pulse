---
name: test-checklist
description: Test-writing checklist for the Pulse project — what unit and integration tests are expected for a new use case, route, or domain entity method, following this repo's existing Vitest conventions (in-memory fakes for units, real Postgres via Fastify .inject() for integration). Use before considering a backend change "done", or when asked what tests are missing for a change.
---

# Test-writing checklist (Pulse)

Run through the relevant section(s) below for whatever you just changed. This project has no
Jest/Playwright — everything is Vitest. `npm run docker:check` must pass before anything
counts as finished.

## New use case → `tests/unit/use-cases/<name>.test.ts`

- [ ] Success path: correct return value, and correct calls into the repository/ports
      (e.g. did it call `hasher.hash`, not store the plaintext password?)
- [ ] Every domain error the use case can throw, one test each (`NotFoundError`,
      `ConflictError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`) —
      assert `.rejects.toBeInstanceOf(X)`, not just that it throws
- [ ] Boundary/edge inputs relevant to this use case specifically (empty string, zero,
      already-expired token, already-revoked token, duplicate value) — see
      `tests/unit/use-cases/refresh-session.test.ts` for the shape of this (expired token,
      revoked token/replay detection, unknown token)
- [ ] If it touches an `IClock`-dependent expiry/TTL, use `tests/fakes/fake-clock.ts` and
      advance time explicitly rather than real `setTimeout`/`Date.now()`
- [ ] Uses the existing fake for its repository (`tests/fakes/in-memory-*.repository.ts`);
      add a new fake only if one doesn't exist yet, modeled on an existing one
- [ ] No real Postgres, no real network call, no real Docker — if a test needs any of
      those, it's an integration test, not a unit test

## New domain entity method → `tests/unit/domain/<entity>.entity.test.ts`

- [ ] Test the method directly, constructing the entity with `new Entity({...})` — don't
      go through a use case just to exercise entity logic indirectly
- [ ] Cover the boundary the method exists to enforce (e.g. `isValid(now)`: valid before
      expiry, invalid at/after expiry, invalid once revoked/used — see
      `tests/unit/domain/refresh-token.entity.test.ts`)
- [ ] If the method is a static factory/validator (`Target.validateConfig`), test each
      branch of what it accepts vs. rejects — see `tests/unit/domain/target.entity.test.ts`

## New or changed HTTP route → `tests/integration/*.integration.test.ts`

Uses `ctx.app.inject({ method, url, headers, payload })` against a real Postgres
(`tests/integration/setup.ts` — truncates all tables in `beforeEach`). Check:

- [ ] Happy path: correct status code and response shape
- [ ] `401` with no `Authorization` header (or an invalid one) if the route requires auth
- [ ] `403` if the route is role-gated and the test uses a lower-privileged caller (an API
      key carries a fixed `member` role — see
      `tests/integration/tenant-isolation.integration.test.ts`'s RBAC test for the pattern)
- [ ] `422` for a request body that violates the Zod schema (missing required field, wrong
      type)
- [ ] **If the route is tenant-scoped** (almost everything is): a second tenant cannot read,
      update, or delete the first tenant's resource — expect `404`, not `403` (avoids
      confirming the resource exists to another tenant). This is the single most
      important test category in this codebase — see
      `tests/integration/tenant-isolation.integration.test.ts` for the exact assertions to copy.
- [ ] If the request body could plausibly include a `tenantId` field, explicitly test that
      a spoofed value is ignored and the JWT's tenant is used instead

## Don't bother testing

- Framework glue (Fastify plugin registration, Drizzle query builder calls) — trust the
  framework/library; test *your* logic, not theirs
- Getters with no logic
- Anything already covered by an existing integration test for the same route/use case —
  don't duplicate a happy-path test that already exists elsewhere

## Before calling it done

```bash
npm run docker:check   # lint + typecheck + unit + integration, all in the container
```
