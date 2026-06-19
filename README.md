# Cardence

Sandbox-grade **Issuer-Side Card Lifecycle Management System**.  
Full-stack monorepo: NestJS REST API · React admin UI · MySQL · JWT auth · Maker-checker dual control.

---

## Architecture

```
cardence/
├── apps/
│   ├── api/          NestJS 10, TypeORM 0.3, MySQL 8 (port 3000)
│   └── web/          React 18, Vite 5, TanStack Query 5 (port 5173)
└── packages/
    └── shared/       TypeScript types (CJS + ESM via tsup)
```

### API domains

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT login (15 m access + 7 d refresh), RBAC guards |
| `cards` | Full card lifecycle state machine, PIN, limit overrides |
| `maker-checker` | Dual-control approval queue (four-eyes principle) |
| `authorization` | Per-txn engine: channel, limit, velocity, balance debit, double-entry posting |
| `audit` | Immutable append-only event log on every state change |
| `customers` · `accounts` · `card-products` | Supporting domain entities |

### Financial non-negotiables

- All monetary amounts stored as **BIGINT / `string`** in TypeScript (never `float`)
- PAN never persisted — only `panToken` (UUID), `panLast4`, `panMasked`
- PIN stored as **bcrypt hash only** (HSM swap point via abstract `PinService`)
- `@VersionColumn()` optimistic locking on `Account` for concurrent balance debits
- Double-entry posting: every approved authorization creates a DEBIT + CREDIT entry

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 (`npm i -g pnpm@9`) |
| Docker + Docker Compose | any recent version |

---

## Quick Start

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Start MySQL 8 + Adminer (http://localhost:8080)
docker-compose up -d

# 3. Copy environment template
cp .env.example .env

# 4. Run all database migrations
pnpm migration:run

# 5. Seed demo data (users, products, customers, cards, transactions)
pnpm seed

# 6. Start the API and web app in separate terminals
pnpm dev:api   # → http://localhost:3000
pnpm dev:web   # → http://localhost:5173
```

Open **http://localhost:5173** and sign in with any of the seed credentials below.

---

## Seed credentials

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `admin@cardence.dev` | `Admin1234!` | admin | Full access including card products |
| `officer@cardence.dev` | `Officer1234!` | officer | Create customers, accounts, cards; submit authorizations |
| `approver@cardence.dev` | `Approver1234!` | approver | Approve / reject maker-checker requests |
| `viewer@cardence.dev` | `Viewer1234!` | viewer | Read-only on all GET endpoints |

### Seed data snapshot

- **4** users (one per role)
- **3** card products (Standard Visa Debit · Gold Mastercard Credit · Corporate Amex)
- **5** customers (Alice, Bob, Carol, David, Eve) with **5** accounts
- **10** cards covering every lifecycle state: ACTIVE × 4, ISSUED × 1, REQUESTED × 1, BLOCKED × 1, HOTLISTED × 1, CLOSED × 1, EXPIRED × 1
- **1** pending CARD_ISSUANCE approval (Carol's REQUESTED card — approve it with the `approver` account)
- **8** transactions (6 APPROVED, 2 DECLINED) pre-dated across the last week

---

## Sample curl workflow

Set a shell variable once after login — all subsequent commands reuse `$TOKEN`.

### 1. Login

```bash
curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"officer@cardence.dev","password":"Officer1234!"}' \
  | jq .

# Copy accessToken into TOKEN:
TOKEN=<paste accessToken here>
```

### 2. Refresh an expired access token

```bash
curl -s -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
```

### 3. Create a customer

```bash
curl -s -X POST http://localhost:3000/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane.doe@example.com","phone":"+12025550199"}' \
  | jq .
```

### 4. Open an account

```bash
curl -s -X POST http://localhost:3000/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"customerId":"<customer-uuid>","currency":"USD"}' \
  | jq .
```

### 5. Request a card (creates a pending approval)

```bash
curl -s -X POST http://localhost:3000/cards \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"accountId":"<account-uuid>","cardProductId":"<product-uuid>"}' \
  | jq .
```

### 6. Approve the card issuance (requires approver role)

```bash
# Login as approver
TOKEN_APPROVER=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"approver@cardence.dev","password":"Approver1234!"}' \
  | jq -r .accessToken)

# List pending approvals
curl -s http://localhost:3000/approvals \
  -H "Authorization: Bearer $TOKEN_APPROVER" | jq .

# Approve
curl -s -X POST http://localhost:3000/approvals/<approval-uuid>/approve \
  -H "Authorization: Bearer $TOKEN_APPROVER" | jq .
```

### 7. Activate the card

```bash
curl -s -X POST http://localhost:3000/cards/<card-uuid>/activate \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 8. Submit an authorization

```bash
curl -s -X POST http://localhost:3000/authorizations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
    "cardId": "<card-uuid>",
    "channel": "POS",
    "amountMinorUnits": "2500",
    "currency": "USD",
    "merchantName": "Demo Merchant"
  }' | jq .
```

### 9. View card transactions

```bash
curl -s http://localhost:3000/cards/<card-uuid>/transactions \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 10. Other card lifecycle operations

```bash
curl -s -X POST http://localhost:3000/cards/<id>/block    -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3000/cards/<id>/unblock  -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3000/cards/<id>/hotlist  -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3000/cards/<id>/renew    -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3000/cards/<id>/replace  -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3000/cards/<id>/close    -H "Authorization: Bearer $TOKEN"

# Request a limit change (creates another maker-checker approval)
curl -s -X POST http://localhost:3000/cards/<id>/limits \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"dailyLimitMinorUnits":200000,"perTxnLimitMinorUnits":50000}'
```

---

## Key API endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | public | Obtain access + refresh tokens |
| POST | `/auth/refresh` | public | Reissue access token |
| GET | `/health` | public | Liveness check |
| GET/POST | `/customers` | viewer / officer | List or create customers |
| GET/POST | `/accounts` | viewer / officer | List or create accounts |
| GET/POST | `/card-products` | viewer / admin | List or create card products |
| POST | `/cards` | officer | Request a new card (→ pending approval) |
| POST | `/cards/:id/activate` | officer | ISSUED → ACTIVE |
| POST | `/cards/:id/block` | officer | ACTIVE → BLOCKED |
| POST | `/cards/:id/unblock` | officer | BLOCKED → ACTIVE |
| POST | `/cards/:id/hotlist` | officer | → HOTLISTED (irreversible except close) |
| POST | `/cards/:id/renew` | officer | Extend expiry +3 years (ACTIVE only) |
| POST | `/cards/:id/replace` | officer | Close + re-issue replacement card |
| POST | `/cards/:id/close` | officer | Terminal state |
| POST | `/cards/:id/pin` | officer | Set PIN — 204, nothing returned |
| POST | `/cards/:id/pin/reset` | officer | Clear PIN hash |
| POST | `/cards/:id/limits` | officer | Request limit change (→ pending approval) |
| GET | `/cards/:id/transactions` | viewer | Transaction history (newest first) |
| GET | `/approvals` | approver | Pending approval queue |
| POST | `/approvals/:id/approve` | approver | Approve — four-eyes: approver ≠ initiator |
| POST | `/approvals/:id/reject` | approver | Reject request |
| POST | `/authorizations` | officer | Submit authorization (8-check engine) |
| GET | `/audit-events` | viewer | Immutable audit log (`?entityType=&entityId=`) |

---

## Card lifecycle state machine

```
REQUESTED ──(approve)──► ISSUED ──(activate)──► ACTIVE ──────────────────────────┐
                                                   │                              │
                                             (block)│                       (renew)│
                                                   ▼                              │
                                                BLOCKED ──(unblock)───────────────┘
                                                   │
                              (hotlist / close) ───┤──────────────────────────────────┐
                                                   ▼                                  │
                                               HOTLISTED ──(close)──► CLOSED ◄────────┤
                                                                           ▲           │
                                           ACTIVE ──(hotlist/close)───────┘           │
                                           EXPIRED ──(close)──────────────────────────┘
```

---

## Running tests

```bash
# All workspace tests
pnpm test

# API only (Jest)
pnpm --filter api test

# Web only (Vitest)
pnpm --filter web test

# API with coverage
pnpm --filter api test:cov
```

**91 tests · 7 suites** (90 API · 1 web) — all passing.

---

## Database tooling

```bash
# Adminer (browser GUI)
open http://localhost:8080
# Server: db  User: cardence  Password: cardence_dev  DB: cardence

pnpm migration:run      # apply pending migrations
pnpm migration:revert   # roll back last migration
pnpm seed               # seed demo data (idempotent — skips if already seeded)
```

---

## Environment variables

Copy `.env.example` → `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `cardence` | MySQL username |
| `DB_PASSWORD` | `cardence_dev` | MySQL password |
| `DB_NAME` | `cardence` | Database name |
| `API_PORT` | `3000` | NestJS listen port |
| `JWT_SECRET` | *(set this)* | Access token signing secret |
| `JWT_REFRESH_SECRET` | *(set this)* | Refresh token signing secret |
| `VITE_API_URL` | `http://localhost:3000` | API base URL for the web app |

> `.env` is git-ignored. Never commit real secrets.
