# Pulse

Pulse is a multi-tenant network and service health monitoring platform. It's the kind
of tool a team reaches for when they need to know the moment an API endpoint, a
database port, a DNS record, or a host stops responding — without standing up a whole
observability stack just to watch a handful of things.

Each organization that signs up is a fully isolated tenant with its own users, targets,
history, and alert routing. Within an organization:

- **Configure targets** to watch over HTTP(S), TCP, DNS, or ICMP ping, each with its own
  check interval and timeout
- **Watch them live** on a dashboard that updates over a WebSocket the instant a check
  completes — status, latency, and a short trend line per target
- **See what happened** via per-target history, not just the current state
- **Get alerted** on Slack, Discord, or a generic webhook the moment something flips
  from up to down (or back), not on every routine check
- **Manage access** with role-based permissions (`owner` / `admin` / `member`) and issue
  scoped API keys for scripts and CI to talk to the same API a human would use
- **Export metrics** in Prometheus format if you already have your own dashboards

Under the hood: Fastify 5 + TypeScript (strict) on the backend, PostgreSQL 17 via
Drizzle for storage, and a Vue dashboard talking to the API over REST and WebSockets.
The monitoring engine runs entirely in-process — a scheduler with bounded concurrency
and per-target circuit breakers — so there's nothing extra to deploy or operate beyond
the app itself and its database.

**Contents**: [Architecture](#architecture) ·
[Build the environment](#build-the-environment) · [Use the app](#use-the-app) ·
[Testing](#testing) · [CI](#ci)

---

## Architecture

The short version: Clean Architecture (`domain` → `application` → `infrastructure`), a
scheduler + worker pool + circuit breaker driving the checks, and an event bus fanning
results out to the live dashboard and the alert dispatcher independently.

**→ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** has the full breakdown: layer
diagram, the design-pattern-by-pattern map, the monitoring engine's data flow, how
multitenancy is enforced, the auth sequence, observability, and the project structure.

---

## Build the environment

Nothing runs on the host — Postgres, the backend, the frontend, and every check/lint/test
command all run inside containers.

### Quick start

```bash
cp .env.example .env
npm run docker:dev       # Postgres + backend (hot reload) + frontend (hot reload)
npm run docker:migrate   # apply database migrations (first run, and after new ones)
```

| Service | URL |
|---|---|
| Backend + API | `http://localhost:3000` |
| Frontend (hot reload) | `http://localhost:5173` |
| Postgres | `localhost:5433` (off the default `5432` to avoid local collisions) |

### Everything else runs in the container too

No local Node install needed:

```bash
npm run docker:lint
npm run docker:typecheck
npm run docker:test          # unit tests
npm run docker:test:integration
npm run docker:test:all
npm run docker:check         # lint + typecheck + test:all
npm run docker:build         # compile backend + build frontend
npm run docker:shell         # shell into the running backend container
npm run docker:logs          # tail logs for the whole dev stack
npm run docker:dev:down      # stop the dev stack
```

A few more (`docker:generate`, `docker:install`, `docker:web:install`) round out
day-to-day tasks — see `package.json` for the full list. Equivalent `make` targets exist
too (`make up`, `make test`, `make check`, ...) for anyone who prefers `make` over npm
scripts — see the [`Makefile`](Makefile).

### No local "production mode"

Dev mode is the only stack you run day to day. The production Docker target (single
image, frontend baked in, no hot reload) exists for deploying and for CI to validate on
every push. If you ever need to sanity-check it locally:

```bash
docker build --target production -t pulse-node .
```

That image has no `tsx`/`src`, so its migration entrypoint is `db:migrate:prod`
(`node dist/infrastructure/database/migrate.js`) instead of the dev `db:migrate` script.

An actual deployment should layer on `docker-compose.prod.yml` too — it adds a read-only
root filesystem, drops all Linux capabilities, and mounts a tmpfs `/tmp` (the app never
needs to write to its own container filesystem, so there's nothing to lose):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Optional: Prometheus + Grafana

```bash
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d prometheus grafana
# Prometheus: :9090   Grafana: :3300 (admin/admin)
```

### Configuration

All config is environment variables, Zod-validated at startup (fails fast on a
missing/malformed value) — see [`.env.example`](.env.example) for the full list.

---

## Use the app

**Via the browser**: open `http://localhost:3000` (or `:5173` in dev), register an
organization, sign in, and use **+ Add target** on the dashboard — status, latency, and
a sparkline update live over WebSocket as checks run. Alert channels and API keys have
the same add-via-modal flow further down the page.

**Via the API:**

```bash
# Register an organization + owner user
curl -X POST http://localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"tenantName":"Acme Inc","email":"owner@acme.test","password":"supersecret123"}'

# Log in
curl -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"owner@acme.test","password":"supersecret123"}'
# => { "accessToken": "...", "refreshToken": "..." }

TOKEN=<accessToken>
```

```bash
# Add a target
curl -X POST http://localhost:3000/api/targets \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Google DNS","type":"http","config":{"url":"https://dns.google"},"intervalSeconds":30,"timeoutMs":5000}'

# Live dashboard snapshot
curl http://localhost:3000/api/dashboard -H "authorization: Bearer $TOKEN"

# Target history
curl "http://localhost:3000/api/targets/<targetId>/history?sinceHours=24&limit=200" \
  -H "authorization: Bearer $TOKEN"
```

```bash
# Configure a Slack alert channel
curl -X POST http://localhost:3000/api/alert-channels \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"type":"slack","name":"#alerts","url":"https://hooks.slack.com/services/..."}'

# Issue an API key for programmatic access (shown once)
curl -X POST http://localhost:3000/api/api-keys \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' -d '{"name":"ci-key"}'
# use it as: curl http://localhost:3000/api/targets -H "x-api-key: pk_..."

# Prometheus metrics
curl http://localhost:3000/metrics
```

**Live updates**: `GET /ws/dashboard?token=<accessToken>` — sends a `dashboard.snapshot`
on connect, then a `check.completed` message per re-check, scoped to that tenant only.

Invalid requests return `422` with a structured error body; domain errors (not found,
conflict, forbidden, ...) map to the matching HTTP status.

---

## Testing

```bash
npm run docker:test             # unit — use cases against in-memory fakes, no DB
npm run docker:test:integration # full HTTP flow against a real Postgres
```

`npm test` / `npm run test:integration` are the underlying scripts the container itself
runs — use those directly only if you're already inside the container, e.g. via
`npm run docker:shell`.

---

## CI

`.github/workflows/ci.yml` builds the same dev images used locally and runs
lint/typecheck/unit/integration/build inside them (plus a frontend lint/build and a
final production Docker build) on every push and PR — CI exercises the exact same
containerized path as local development.
