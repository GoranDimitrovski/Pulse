---
name: large-refactor-worktree
description: How to set up an isolated git worktree for a large refactor on Pulse (framework upgrade, state-management migration, a rewrite touching many files) so it doesn't disturb the main checkout — including the Docker-specific gotcha this project has already hit twice. Use when starting risky, wide-reaching work you want fully isolated from the working tree you're actively using for everything else.
---

# Isolated worktree for large refactors (Pulse)

## When to reach for this

A framework upgrade (e.g. Vue 4, Fastify 6), a state-management migration, or any refactor
touching enough files that you want your main checkout free to keep doing normal work (or
just want an easy `rm -rf` escape hatch if the refactor doesn't pan out).

## How

Use the CLI `--worktree` flag or the `EnterWorktree` tool to create and switch into an
isolated worktree. `node_modules` and `web/node_modules` are already configured to symlink
from the main checkout (see `.claude/settings.json`'s `worktree.symlinkDirectories`) — the
worktree gets working dependencies immediately, no `npm install` needed on entry.

By default a new worktree branches from `origin/main` (a clean base). If the refactor needs
to build on uncommitted or unpushed work already in your main checkout, note that explicitly
— the default `baseRef: "fresh"` behavior in `.claude/settings.json` won't include it (set
`baseRef: "head"` there first if you want that to be the standing default instead).

## The Pulse-specific gotcha: Docker resource names collide across worktrees

**This bit us twice already in this project's history** (once destroying an unrelated
container, once causing dev/prod image-tag drift) — it will bite a worktree the same way if
you're not deliberate about it.

`docker-compose.yml` pins `name: pulse-node` at the top. A worktree checkout is a full copy
of the repo, including that same compose project name. If you run `npm run docker:dev` (or
any `docker compose` command) from inside the worktree while the main checkout's stack is
also running, both will try to use containers/networks/volumes named `pulse-node-*` —
**second one to start will either fail to bind ports, or silently reuse/recreate the other's
containers**, exactly like the collision documented in this project's git history.

**Before running anything Docker-related inside a worktree**, either:

1. Stop the main checkout's stack first (`npm run docker:dev:down`), and only run one stack
   at a time, **or**
2. Give the worktree's stack a distinct project name for the duration of the refactor:
   `docker compose -p pulse-node-refactor -f docker-compose.yml -f docker-compose.dev.yml up -d --build`
   (note: the `npm run docker:*` scripts don't take a `-p` override — invoke `docker compose`
   directly with `-p <name>` for anything run from inside the worktree, or temporarily edit
   the worktree's own `docker-compose.yml` `name:` field — it won't affect the main checkout
   since they're separate files after the worktree copy).

Either way, **confirm which stack you're touching before any destructive Docker command**
(`down -v`, `--remove-orphans`) — check `docker ps` for the actual container names in play,
don't assume.

## When the refactor is done

Merge/rebase as normal, then remove the worktree (`EnterWorktree`'s exit path or
`git worktree remove`) — don't leave stale worktrees with their own dangling Docker stacks
running in the background.
