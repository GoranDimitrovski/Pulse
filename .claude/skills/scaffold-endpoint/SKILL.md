---
name: scaffold-endpoint
description: Scaffold a new API endpoint end-to-end for the Pulse project — domain/use-case/repository/route on the backend, plus the matching api.ts method, types.ts entry, and Vue component/composable on the frontend — following this repo's exact Clean Architecture and tenant-isolation conventions. Use when adding a new API endpoint, a new CRUD operation on an existing resource, or a new domain concept that needs a route.
---

# Scaffold a new API endpoint (Pulse)

Follow this order. Each step names the real files to model the new code after — copy their
shape, don't invent a new pattern.

## 0. Clarify scope first

Ask (or infer from context): does this belong to an **existing** aggregate (`Target`,
`AlertChannel`, `ApiKey`, `User`, `Tenant`, `CheckResult`) or is it a **new** domain concept?
Most requests are the former (a new operation on an existing resource) — skip straight to
step 3 if so.

## 1. New domain entity (only if this is a genuinely new concept)

- `src/domain/entities/<name>.entity.ts` — a class with a `<Name>Props` interface and
  constructor-assigned public readonly fields. Add real behavior methods only where there's
  an actual invariant to encapsulate (see `Target.validateConfig`, `RefreshToken.isValid` for
  the pattern) — don't add a method with no logic just for symmetry.
- `src/domain/repositories/<name>.repository.ts` — the repository *interface* only.
  **Every method that reads/writes tenant data must take `tenantId` as an explicit
  parameter** — this is not optional, see `src/domain/repositories/target.repository.ts`.

## 2. Schema + migration (only alongside step 1)

- Add the table to `src/infrastructure/database/schema.ts` (follow the existing tables for
  column conventions: `id` uuid default random, `tenant_id` uuid FK with cascade delete,
  `created_at`/`updated_at` timestamptz).
- Run `npm run docker:generate` to produce the migration — **never hand-write migration SQL**.
- Run `npm run docker:migrate` to apply it locally.

## 3. Repository implementation (only if step 1 happened)

`src/infrastructure/database/repositories/drizzle-<name>.repository.ts` — model on
`drizzle-target.repository.ts`: construct real entity instances (`new Target(row!)` for
`create`, `row ? new Target(row) : null` for finds), never return raw Drizzle rows.

## 4. Use case(s)

`src/application/use-cases/<area>/<verb>-<name>.use-case.ts` — one class, one `execute()`
method, constructor-injected dependencies (repositories, ports — never a concrete
infrastructure class). Model on `src/application/use-cases/targets/create-target.use-case.ts`
(command) or `list-targets.use-case.ts` (query). Throw the right domain error from
`src/domain/errors/domain-error.ts` (`NotFoundError`, `ConflictError`, `ValidationError`,
`ForbiddenError`) — the global error handler maps these to HTTP status automatically.

## 5. Route

Add to an existing file in `src/infrastructure/http/routes/`, or create a new one modeled on
`targets.routes.ts`:

- Zod schema for `body`/`params`/`querystring` via `@fastify/type-provider-zod`.
- `preHandler: [app.authenticate, app.withTenantContext]` on every route, plus
  `app.requireRole('admin')` (or `'owner'`) appended for anything that mutates — check
  existing routes for which role tier fits (creating a target needs `admin`; issuing an API
  key needs `owner`).
- **Always** pull `tenantId` from `request.authUser!.tenantId` — never accept one in the
  body/params, even if the client sends one (it must be silently ignored, per
  `tests/integration/tenant-isolation.integration.test.ts`).
- If it's a new route file, register it in `src/infrastructure/http/app.ts` with its prefix.

## 6. Wire the composition root

Add the new repository/use case to `src/infrastructure/composition/container.ts` — this is
the *only* place concrete classes get instantiated and connected to their interfaces.

## 7. Tests

- **Unit**: `tests/unit/use-cases/<verb>-<name>.test.ts` against an in-memory fake
  (`tests/fakes/in-memory-<name>.repository.ts` — add one if it doesn't exist, modeled on
  `in-memory-target.repository.ts`). Cover the success path and every error path the use
  case can throw.
- **Integration**: extend or add to `tests/integration/` using `ctx.app.inject(...)` —
  cover success, and if tenant-scoped, a cross-tenant access attempt (expect `404`) and a
  request-body `tenantId` spoof attempt (expect it ignored). See
  `tests/integration/tenant-isolation.integration.test.ts` for the exact pattern.
- Run `npm run docker:check` before considering this done.

## 8. Frontend

- **API client**: add a method to the `api` object in `web/src/lib/api.ts` — follow the
  existing methods' shape (`apiFetch<ReturnType>(path, { method, body: JSON.stringify(input) })`).
- **Types**: add/extend an interface in `web/src/lib/types.ts` matching the backend entity's
  serialized shape (dates as `string`, not `Date` — they cross JSON as ISO strings).
- **Component**: a new `.vue` SFC under `web/src/components/` or `web/src/pages/`,
  `<script setup lang="ts">`, calling the new `api.*` method — never `fetch()` directly (see
  `web/CLAUDE.md`). If it needs a create/edit form, use the `Modal.vue` pattern
  (`web/src/components/CreateTargetForm.vue` + how `DashboardPage.vue` opens it in a `Modal`
  is the reference example).

## 9. Verify

`npm run docker:check` (lint + typecheck + all tests), then actually exercise it —
`npm run docker:dev` and hit the new endpoint with `curl` (see the README's "Use the app"
section for the auth flow to get a token) before calling it done.
