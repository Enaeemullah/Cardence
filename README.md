# Cardence

Card Lifecycle Management System (sandbox-grade).

## Prerequisites

- Node.js 20 LTS
- pnpm 9+
- Docker & Docker Compose

## Setup

```sh
# 1. Install dependencies
pnpm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env if needed (defaults work with docker-compose)

# 3. Start MySQL
docker compose up -d

# 4. Run database migrations
pnpm migration:run

# 5. Start API  (http://localhost:3000)
pnpm dev:api

# 6. Start web  (http://localhost:5173)
pnpm dev:web
```

## Health check

```sh
curl http://localhost:3000/health
# {"status":"ok","timestamp":"..."}
```

## Tests

```sh
pnpm test
```

## Monorepo structure

```
apps/
  api/   — NestJS REST API (TypeORM, MySQL)
  web/   — React + Vite SPA (React Query)
packages/
  shared/ — Shared TypeScript types consumed by both apps
docker-compose.yml — MySQL 8 + Adminer
```
