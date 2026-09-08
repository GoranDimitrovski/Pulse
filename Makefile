DEV = docker compose -f docker-compose.yml -f docker-compose.dev.yml

.PHONY: up down logs ps shell \
	migrate generate \
	test test-integration test-all lint typecheck build check \
	install web-install

## Development stack (Postgres + backend hot-reload + frontend hot-reload)
up:
	$(DEV) up -d --build

down:
	$(DEV) down

logs:
	$(DEV) logs -f

ps:
	$(DEV) ps

shell:
	$(DEV) exec app sh

## Database
migrate:
	$(DEV) run --rm app npm run db:migrate

generate:
	$(DEV) run --rm app npm run db:generate

## Checks — each spins up its own one-off container, so these never depend on
## (or drift from) whatever the long-running `app` container currently is.
test:
	$(DEV) run --rm app npm test

test-integration:
	$(DEV) run --rm app npm run test:integration

test-all:
	$(DEV) run --rm app npm run test:all

lint:
	$(DEV) run --rm app npm run lint

typecheck:
	$(DEV) run --rm app npm run typecheck

build:
	$(DEV) run --rm app npm run build

check: lint typecheck test-all

## Dependencies
install:
	$(DEV) run --rm app npm install

web-install:
	$(DEV) run --rm web npm install
