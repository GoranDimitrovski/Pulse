# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g npm@12.0.2

# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

FROM base AS web-deps
COPY web/package.json web/package-lock.json ./web/
RUN --mount=type=cache,target=/root/.npm \
    npm --prefix web ci --no-audit --no-fund

# ---- development (hot reload) ------------------------------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- frontend build -----------------------------------------------------------
FROM base AS web-build
COPY --from=web-deps /app/web/node_modules ./web/node_modules
COPY web ./web
RUN npm --prefix web run build

# ---- backend build --------------------------------------------------------
# Compiles the backend only (tsc directly, not `npm run build`, which also cascades into
# rebuilding the frontend via `build:web` — already done above in the web-build stage).
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=web-build /app/web/dist ./web/dist
RUN npx tsc -p tsconfig.build.json

# ---- production runtime ------------------------------------------------------
FROM node:24-alpine AS production
LABEL org.opencontainers.image.title="Pulse" \
      org.opencontainers.image.description="Multi-tenant network health monitoring platform"
ENV NODE_ENV=production
WORKDIR /app
RUN npm install -g npm@12.0.2
RUN addgroup -S pulse && adduser -S pulse -G pulse
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund
COPY --from=build /app/dist ./dist
COPY --from=build /app/web/dist ./web/dist
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
USER pulse
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
