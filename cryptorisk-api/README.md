# CryptoRisk API

Production-quality REST API for the Crypto Portfolio Risk Analyzer.

**Stack:** Node.js · Express · Prisma (PostgreSQL) · Redis · JWT · CoinGecko

---

## Quick Start

### 1. Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| PostgreSQL | ≥ 14 |
| Redis | ≥ 6 |

### 2. Install dependencies

```bash
cd cryptorisk-api
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/cryptorisk_db
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<at-least-32-random-chars>
JWT_REFRESH_SECRET=<at-least-32-different-random-chars>
```

All other values have sensible defaults.

### 4. Create the database

```bash
# Using psql
createdb cryptorisk_db
# Or via psql prompt:
# CREATE DATABASE cryptorisk_db;
```

### 5. Run migrations

```bash
npx prisma migrate dev --name init
```

This creates all five tables:
- `users`
- `refresh_tokens`
- `portfolios`
- `holdings`  
- `price_snapshots`

And generates the Prisma client automatically.

### 6. Start Redis

```bash
# macOS/Linux
redis-server

# Windows (WSL or via installer)
redis-server --daemonize yes
```

### 7. Start the dev server

```bash
npm run dev
# Server: listening on http://localhost:3000 [development]
```

---

## Running Tests

Tests cover the pure math module — no DB or network required.

```bash
npm test
```

Expected output: all tests in `tests/math/riskCalculations.test.js` pass.

---

## API Reference

Base URL: `http://localhost:3000/api`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account, returns access token |
| POST | `/auth/login` | — | Sign in, returns access token |
| POST | `/auth/refresh` | Cookie | Issue new access token |
| POST | `/auth/logout` | Cookie | Revoke refresh token |

**Auth header:** `Authorization: Bearer <accessToken>`  
**Refresh cookie:** `refreshToken` (httpOnly, Secure)

### Portfolio

All endpoints require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/portfolio` | Create portfolio |
| GET | `/portfolio` | List all user portfolios |
| GET | `/portfolio/:id` | Get one portfolio with holdings |
| PUT | `/portfolio/:id` | Rename portfolio |
| DELETE | `/portfolio/:id` | Delete portfolio (cascades holdings) |
| POST | `/portfolio/:id/holdings` | Add holding |
| PUT | `/portfolio/:id/holdings/:hid` | Update holding quantity |
| DELETE | `/portfolio/:id/holdings/:hid` | Remove holding |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/portfolio/:id/summary` | Total value, allocation %, 24h change |
| GET | `/portfolio/:id/risk` | Volatility, Sharpe, risk score (0–100) |
| GET | `/portfolio/:id/correlation` | Pearson correlation matrix |

### Market Data

| Method | Endpoint | Description |
|---|---|---|
| GET | `/coins/:coinId/history?range=30\|90\|365` | Historical daily prices |

---

## Error Response Format

All errors follow this shape:

```json
{
  "error": {
    "message": "Human-readable description",
    "code": "ERROR_CODE"
  }
}
```

Validation errors include an `issues` array with per-field details.

---

## Design Notes

### Security
- Passwords hashed with bcrypt (12 rounds)
- Access tokens expire in 15 minutes
- Refresh tokens stored in DB and can be revoked
- `helmet` applied for all security headers (CSP, XSS, HSTS, etc.)
- Rate limiting: 20 req/15min on auth, 100 req/min globally

### Fixes Applied

| # | Fix | Location |
|---|---|---|
| 1 | `Decimal(20,8)` for quantity/price | `prisma/schema.prisma` |
| 2 | Sharpe ratio annualises daily returns before applying annual rfr | `src/math/riskCalculations.js` |
| 3 | Correlation matrix handles mismatched history lengths with overlap check | `src/math/riskCalculations.js` |
| 4 | `helmet()` middleware for security headers | `src/app.js` |
| 5 | `onDelete: Cascade` on Holding→Portfolio, RefreshToken→User | `prisma/schema.prisma` |

### Caching Strategy (CoinGecko)
1. **PostgreSQL** `price_snapshots` — historical data stored on first fetch, never re-fetched
2. **Redis** — live prices: 60s TTL; historical: 24h TTL
3. **CoinGecko** — fallback with retry-backoff (3 retries, exponential, on 429/5xx)
