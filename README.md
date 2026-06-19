# Cardence

Sandbox-grade **Issuer-Side Card Lifecycle Management System**.  
Full-stack monorepo: NestJS REST API · React admin UI · MySQL · JWT auth · Maker-checker dual control.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Project structure](#project-structure)
3. [Financial non-negotiables](#financial-non-negotiables)
4. [Prerequisites](#prerequisites)
5. [Quick Start](#quick-start)
6. [Admin UI](#admin-ui)
7. [RBAC matrix](#rbac-matrix)
8. [Card lifecycle state machine](#card-lifecycle-state-machine)
9. [Maker-checker workflow](#maker-checker-workflow)
10. [Authorization engine](#authorization-engine)
11. [Key API endpoints](#key-api-endpoints)
12. [Sample curl workflow](#sample-curl-workflow)
13. [Seed credentials](#seed-credentials)
14. [Running tests](#running-tests)
15. [Production build](#production-build)
16. [Database tooling](#database-tooling)
17. [Environment variables](#environment-variables)

---

## Architecture

```
cardence/
├── apps/
│   ├── api/          NestJS 10, TypeORM 0.3, MySQL 8 (port 3000)
│   └── web/          React 18, Vite 5, TanStack Query 5 (port 5173)
└── packages/
    └── shared/       TypeScript types shared across api + web (CJS + ESM via tsup)
```

### API modules

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT login (15 m access + 7 d refresh), bcrypt password verify, token refresh, RBAC guards |
| `cards` | Full card lifecycle state machine, PIN set/reset, limit override requests |
| `card-lifecycle` | Internal state-transition service consumed by `cards`; guards illegal transitions |
| `maker-checker` | Dual-control approval queue — CARD_ISSUANCE and LIMIT_CHANGE request types |
| `authorization` | Per-transaction 8-check engine; optimistic-lock balance debit; double-entry posting |
| `audit` | Immutable append-only `AuditEvent` log written on every state change |
| `customers` | Customer entity CRUD |
| `accounts` | Account entity CRUD; holds `balanceMinorUnits` with `@VersionColumn()` |
| `card-products` | Card product configuration (limits, channels, velocity rules) |
| `pin` | `PinService` — bcrypt hash/verify; abstract boundary for future HSM swap |
| `health` | `GET /health` liveness probe |

---

## Project structure

```
apps/api/src/
├── app.module.ts               Root module; wires APP_GUARD (JwtAuthGuard, RolesGuard)
├── main.ts                     Bootstrap; CORS enabled; global ValidationPipe
├── common/
│   ├── enums/index.ts          All shared enums (CardStatus, UserRole, …)
│   └── exceptions/
│       └── card-transition.exception.ts   400 guard for illegal state transitions
├── entities/                   TypeORM entities (one file per table)
│   ├── user.entity.ts
│   ├── customer.entity.ts
│   ├── account.entity.ts       @VersionColumn() for optimistic locking
│   ├── card-product.entity.ts
│   ├── card.entity.ts
│   ├── transaction.entity.ts
│   ├── posting-entry.entity.ts
│   ├── authorization-request.entity.ts
│   ├── audit-event.entity.ts
│   └── maker-checker-request.entity.ts
├── database/
│   ├── data-source.ts          TypeORM DataSource (synchronize: false)
│   ├── seed.ts                 Idempotent demo seed
│   └── migrations/             Numbered SQL migrations (never auto-sync)
├── auth/                       JWT strategy, guards, decorators (@Public, @Roles, @CurrentUser)
├── cards/                      Card CRUD + lifecycle actions + transactions endpoint
├── card-lifecycle/             Internal state-machine service
├── maker-checker/              Approval queue controller + service
├── authorization/              Transaction auth engine
├── audit/                      AuditEvent controller + service
├── customers/
├── accounts/
├── card-products/
├── pin/
└── health/

apps/web/src/
├── App.tsx                     Router root; QueryClientProvider; AuthProvider
├── main.tsx                    Vite entry point
├── api/
│   └── client.ts               Axios instance; silent 401 refresh interceptor
├── auth/
│   └── AuthContext.tsx         JWT payload decoded from localStorage; login/logout helpers
├── components/
│   ├── Layout.tsx              Sidebar navigation + top bar + role display
│   └── PrivateRoute.tsx        Redirects unauthenticated users to /login
└── pages/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── CardsPage.tsx
    ├── CardDetailPage.tsx
    ├── ApprovalsPage.tsx
    ├── CardProductsPage.tsx
    ├── CustomersPage.tsx
    └── AccountsPage.tsx

packages/shared/src/
└── index.ts                    Canonical TypeScript types shared by both apps
```

### `packages/shared` exports

| Export | Description |
|--------|-------------|
| `CardStatus` | Union type: `'REQUESTED' \| 'ISSUED' \| 'ACTIVE' \| 'BLOCKED' \| 'HOTLISTED' \| 'EXPIRED' \| 'CLOSED'` |
| `CardChannel` | `'ATM' \| 'POS' \| 'ECOM' \| 'INTL'` |
| `CardNetwork` | `'VISA' \| 'MASTERCARD' \| 'AMEX'` |
| `CardProductType` | `'DEBIT' \| 'CREDIT' \| 'PREPAID'` |
| `UserRole` | `'admin' \| 'officer' \| 'approver' \| 'viewer'` |
| `AuthorizationResult` | `'APPROVED' \| 'DECLINED'` |
| `HealthResponse` | `{ status: string; timestamp: string }` |

Import in either app: `import type { CardStatus } from '@cardence/shared'`

---

## Financial non-negotiables

- All monetary amounts stored as **BIGINT** in MySQL and **`string`** in TypeScript — never `number` or `float`
- Amounts are in **minor units** (cents): `2500` = $25.00
- PAN never persisted — only `panToken` (UUID v4), `panLast4`, `panMasked` (`****-****-****-XXXX`)
- PIN stored as **bcrypt hash only** (12 rounds); `PinService` is an abstract boundary for a future HSM integration
- `@VersionColumn()` optimistic locking on `Account` prevents concurrent double-spends; the authorization engine retries up to 3 times on version conflict before declining
- Double-entry posting: every **APPROVED** authorization creates one DEBIT entry (customer account) and one CREDIT entry (synthetic settlement account `00000000-0000-0000-0000-000000000001`)

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

# 3. Copy environment template and fill in JWT secrets
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

## Admin UI

The React admin UI at **http://localhost:5173** provides a complete browser-based interface for all card management operations.

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email + password form; stores access and refresh tokens in `localStorage`; auto-refreshes tokens on 401 via Axios interceptor |
| `/` | Dashboard | Summary counts — total cards, pending approvals, recent transactions, accounts; quick navigation links |
| `/cards` | Cards | Paginated table of all cards with status badges; links to Card Detail |
| `/cards/:id` | Card Detail | Full card record; status-aware action buttons (activate, block, unblock, hotlist, renew, replace, close); transaction history table; PIN set / reset panel; limit override form |
| `/approvals` | Approvals | Pending maker-checker queue (approver/admin only); Approve and Reject buttons with four-eyes enforcement |
| `/card-products` | Card Products | List of card product definitions; create form visible to admin; shows network, type, limits, channel toggles |
| `/customers` | Customers | Customer list with search; create customer form (officer+) |
| `/accounts` | Accounts | Account list showing balance, currency, status; create account form (officer+) |

### Navigation and auth

- **Sidebar** shows only the links relevant to the logged-in role.
- **Token lifecycle**: on page load the app reads `accessToken` from `localStorage` and decodes the JWT payload for role/email. On any 401 response the Axios interceptor silently calls `POST /auth/refresh`, replaces the stored token, and retries the original request. If refresh also fails the user is redirected to `/login`.
- Unauthenticated routes redirect to `/login` via `PrivateRoute`.

---

## RBAC matrix

| Operation | viewer | officer | approver | admin |
|-----------|:------:|:-------:|:--------:|:-----:|
| GET customers / accounts / cards / products | ✓ | ✓ | ✓ | ✓ |
| GET audit-events / transactions | ✓ | ✓ | ✓ | ✓ |
| GET /health | ✓ | ✓ | ✓ | ✓ |
| Create customer / account | | ✓ | | ✓ |
| Request card / card lifecycle actions | | ✓ | | ✓ |
| Submit authorization | | ✓ | | ✓ |
| Set / reset PIN | | ✓ | | ✓ |
| Request limit change | | ✓ | | ✓ |
| Approve / reject maker-checker requests | | | ✓ | ✓ |
| Create / update card products | | | | ✓ |

> The four-eyes rule additionally requires that the **approver ≠ initiator** of a maker-checker request regardless of role.

---

## Card lifecycle state machine

```
REQUESTED ──(approve)──► ISSUED ──(activate)──► ACTIVE ◄──────(unblock)──┐
                                                   │                       │
                                             (block)▼                      │
                                                BLOCKED ───────────────────┘
                                                   │
                         (hotlist / close) ────────┤
                                                   │
           ┌──(hotlist)── ACTIVE                   │
           │                                       ▼
           └──────────────────────────────────► HOTLISTED ──(close)──► CLOSED
                                                                          ▲
                                            ACTIVE ──(close)─────────────┤
                                           BLOCKED ──(close)─────────────┤
                                           EXPIRED ──(close)─────────────┘

ACTIVE ──(renew)──► ACTIVE   (expiry extended +3 years, same card record)
ACTIVE ──(replace)──► CLOSED  +  new REQUESTED card created for the account
```

**Terminal states**: CLOSED (all paths lead here, no exit).  
**Irreversible**: HOTLISTED cards can only be CLOSED.  
Illegal transitions throw `CardTransitionException` (HTTP 400).

---

## Maker-checker workflow

Maker-checker (four-eyes principle) is enforced for two operation types:

| Type | Triggered by | What happens on approve |
|------|-------------|------------------------|
| `CARD_ISSUANCE` | `POST /cards` | Card status advances REQUESTED → ISSUED |
| `LIMIT_CHANGE` | `POST /cards/:id/limits` | Card's `dailyLimitMinorUnits` / `perTxnLimitMinorUnits` updated |

### Step-by-step

1. **Maker** (officer) submits the request — e.g. `POST /cards`. A `MakerCheckerRequest` record is created with `status: PENDING`, `initiatorUserId` set to the maker's user ID.
2. **Approver** calls `GET /approvals` to see the pending queue.
3. **Approver** calls `POST /approvals/:id/approve` or `POST /approvals/:id/reject`.
   - The API enforces `approverUserId ≠ initiatorUserId` — the same person cannot approve their own request (HTTP 403 if violated).
   - On approve: the payload action is executed atomically and an `AuditEvent` is written.
   - On reject: the card stays in its current state; an `AuditEvent` records the rejection.
4. The `MakerCheckerRequest` record is updated with `status: APPROVED | REJECTED`, `approverUserId`, and `decidedAt`.

---

## Authorization engine

`POST /authorizations` runs 8 sequential checks. The first failing check immediately declines the transaction and records a `declineReason`.

| # | Check | Decline reason |
|---|-------|---------------|
| 1 | **Idempotency** — duplicate `idempotencyKey` for the same card returns the existing result without re-processing | _(no decline — returns cached response)_ |
| 2 | **Card active** — card status must be `ACTIVE` | `CARD_NOT_ACTIVE` |
| 3 | **Channel enabled** — card (override) or card product must have the channel flag set (`atmEnabled`, `posEnabled`, `ecomEnabled`, `intlEnabled`) | `CHANNEL_DISABLED` |
| 4 | **Per-transaction limit** — `amountMinorUnits` ≤ effective `perTxnLimitMinorUnits` (card override ?? product default) | `PER_TXN_LIMIT_EXCEEDED` |
| 5 | **Daily spend limit** — sum of today's APPROVED transactions + current amount ≤ effective `dailyLimitMinorUnits` | `DAILY_LIMIT_EXCEEDED` |
| 6 | **Velocity** — count of APPROVED transactions in the product's `velocityWindowSeconds` window < `velocityCount` | `VELOCITY_EXCEEDED` |
| 7 | **Balance** — account `balanceMinorUnits` ≥ `amountMinorUnits` | `INSUFFICIENT_FUNDS` |
| 8 | **Optimistic-lock debit** — decrement balance using TypeORM `@VersionColumn()`; retried up to 3× on concurrent conflict; fails to `INSUFFICIENT_FUNDS` if all retries exhausted | `INSUFFICIENT_FUNDS` |

On approval: a DEBIT posting entry (customer account) and CREDIT posting entry (synthetic settlement account) are written in the same transaction.

---

## Key API endpoints

| Method | Path | Min role | Description |
|--------|------|----------|-------------|
| POST | `/auth/login` | public | Obtain access (15 m) + refresh (7 d) tokens |
| POST | `/auth/refresh` | public | Reissue access token from refresh token |
| GET | `/health` | public | Liveness check |
| GET | `/customers` | viewer | List customers |
| POST | `/customers` | officer | Create customer |
| GET | `/accounts` | viewer | List accounts |
| POST | `/accounts` | officer | Create account |
| GET | `/card-products` | viewer | List card products |
| POST | `/card-products` | admin | Create card product |
| GET | `/cards` | viewer | List cards |
| POST | `/cards` | officer | Request a new card (→ REQUESTED, pending approval) |
| GET | `/cards/:id` | viewer | Get card detail |
| POST | `/cards/:id/activate` | officer | ISSUED → ACTIVE |
| POST | `/cards/:id/block` | officer | ACTIVE → BLOCKED |
| POST | `/cards/:id/unblock` | officer | BLOCKED → ACTIVE |
| POST | `/cards/:id/hotlist` | officer | → HOTLISTED (irreversible except close) |
| POST | `/cards/:id/renew` | officer | Extend expiry +3 years (ACTIVE only) |
| POST | `/cards/:id/replace` | officer | Close current + create replacement card |
| POST | `/cards/:id/close` | officer | → CLOSED (terminal) |
| POST | `/cards/:id/pin` | officer | Set PIN — responds 204, hash stored only |
| POST | `/cards/:id/pin/reset` | officer | Clear PIN hash |
| POST | `/cards/:id/limits` | officer | Request limit change (→ pending approval) |
| GET | `/cards/:id/transactions` | viewer | Transaction history (newest first) |
| GET | `/approvals` | approver | Pending approval queue |
| POST | `/approvals/:id/approve` | approver | Approve — four-eyes enforced |
| POST | `/approvals/:id/reject` | approver | Reject request |
| POST | `/authorizations` | officer | Submit authorization (8-check engine) |
| GET | `/audit-events` | viewer | Immutable audit log (`?entityType=&entityId=`) |

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

Seed is idempotent — re-running `pnpm seed` skips if the admin user already exists.

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

### Test suites

| Suite | File | Coverage |
|-------|------|----------|
| Auth service | `auth/auth.service.spec.ts` | Login, wrong password, refresh valid/invalid |
| Cards service | `cards/cards.service.spec.ts` | Request, activate, block, unblock, hotlist, close, renew |
| Card lifecycle | `card-lifecycle/card-lifecycle.service.spec.ts` | All valid + invalid state transitions |
| Maker-checker | `maker-checker/maker-checker.service.spec.ts` | Approve, reject, four-eyes guard |
| Authorization | `authorization/authorization.service.spec.ts` | All 8 checks (approve + each decline reason) |
| Health | `health/health.controller.spec.ts` | Liveness response |
| Web — App | `App.spec.tsx` | Renders login page when unauthenticated |

---

## Production build

```bash
# Build all packages (shared → api → web)
pnpm build

# Or build individually:
pnpm --filter shared build      # outputs packages/shared/dist/
pnpm --filter api build         # outputs apps/api/dist/
pnpm --filter web build         # outputs apps/web/dist/ (static files for a CDN or nginx)

# Run the compiled API
cd apps/api
node dist/main.js
```

### Serving the web app in production

The Vite build outputs static files to `apps/web/dist/`. Point any static file server at that directory with a fallback to `index.html` for client-side routing.

Example nginx snippet:

```nginx
server {
  listen 80;
  root /srv/cardence/web/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://localhost:3000/;
  }
}
```

Set `VITE_API_URL` before building so the web app points to your production API:

```bash
VITE_API_URL=https://api.example.com pnpm --filter web build
```

---

## Database tooling

```bash
# Adminer browser GUI
open http://localhost:8080
# Server: db  User: cardence  Password: cardence_dev  DB: cardence

pnpm migration:run      # apply all pending migrations
pnpm migration:revert   # roll back the last migration
pnpm seed               # seed demo data (idempotent — skips if already seeded)

# Generate a new migration after changing an entity
pnpm --filter api migration:generate -- src/database/migrations/YourMigrationName
```

Migrations live in `apps/api/src/database/migrations/` and are the only way the schema changes — `synchronize: false` is enforced in the TypeORM `DataSource`.

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
| `JWT_SECRET` | *(required)* | Access token signing secret — use a long random string |
| `JWT_REFRESH_SECRET` | *(required)* | Refresh token signing secret — must differ from `JWT_SECRET` |
| `VITE_API_URL` | `http://localhost:3000` | API base URL for the web app (build-time variable) |

> `.env` is git-ignored. Never commit real secrets.
