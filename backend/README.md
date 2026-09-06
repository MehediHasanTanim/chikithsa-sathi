# Chamber Management backend

Sprints 1–2 establish the NestJS/Fastify, PostgreSQL, Prisma, and Redis foundation plus secure account authentication. Clinical and chamber-domain modules are deliberately not included yet.

## Prerequisites

- Node.js 22+
- npm 10+
- Docker Desktop (for PostgreSQL and Redis)

## Run with Docker

From this directory:

```bash
docker compose up --build
```

The API waits for PostgreSQL and Redis, applies committed Prisma migrations, and then starts. Open:

- `http://localhost:3000/health/live` — process liveness only
- `http://localhost:3000/health/ready` — PostgreSQL and Redis readiness
- `http://localhost:3000/health` — aggregate health
- `http://localhost:3000/api/docs` — OpenAPI UI (enabled by default outside production)

Health probes are intentionally unversioned. Future product endpoints use the `/api/v1` prefix.

## Run locally

```bash
cp .env.example .env
npm install
docker compose up -d postgres redis
npm run prisma:generate
npm run prisma:deploy
npm run start:dev
```

`PORT`, `NODE_ENV`, `DATABASE_URL`, and `REDIS_URL` are validated at startup. The app fails fast if a required value is missing or malformed. Never commit `.env` files.

PostgreSQL persists UTC timestamps. `Asia/Dhaka` is the configured presentation timezone.

## Verify

```bash
npm run format:check
npm run lint
npm run build
npm test
npm run test:e2e
curl -i http://localhost:3000/health/live
```

`npm run test:e2e` uses dependency doubles so it is fast and reliable in any local environment. To manually verify real infrastructure, run Docker Compose and call `/health/ready`; `DATABASE_URL_TEST` is reserved for Sprint 1 integration tests as the database test suite grows.

## Conventions introduced in Sprint 1

- API success: `{ success, data, meta: { requestId } }`
- API error: `{ success: false, error: { code, message, details }, requestId }`
- Request IDs: accepts or creates `x-request-id` and returns it in the response.
- Redis keys: services call `redis.key(domain, key)`; ioredis applies the `cm:{environment}:` prefix.
- Pagination: `toOffsetPagination(page, limit)` clamps input and returns Prisma-ready `skip`/`take`.
- Bangladesh phones: `isBangladeshPhone` accepts `01XXXXXXXXX`, `8801XXXXXXXXX`, and `+8801XXXXXXXXX` formats.

## Authentication API

All product routes are versioned under `/api/v1`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Creates a pending account and OTP challenge. |
| POST | `/auth/verify-otp` | Activates the account after a valid OTP. |
| POST | `/auth/resend-otp` | Replaces an unconsumed OTP after its cooldown. |
| POST | `/auth/login` | Creates a device-aware session and returns token pair. |
| POST | `/auth/refresh` | Rotates the refresh token and invalidates its predecessor. |
| POST | `/auth/logout` | Requires an access token and revokes its session. |
| GET/PATCH | `/users/me` | Reads or updates the authenticated user profile. |

Passwords and OTPs are Argon2id hashes; raw values are never persisted or logged. Refresh tokens are also stored only as hashes. JWT payloads contain only the user ID, session ID, token version, and token type. Set distinct high-entropy JWT secrets before deploying; development-only values in `.env.example` are rejected in production.

Login is limited to five requests per minute per phone/IP pair. Registration, OTP verification, and OTP resend are limited to five requests per ten minutes; registration OTPs expire after ten minutes, permit five attempts, and resends have a 60-second cooldown. An account is locked for 15 minutes after five failed password attempts. These values are configured through `.env`.

The current `OtpDeliveryService` is a safe queue boundary: it receives the raw code only in memory and logs only the OTP record ID. Connect its implementation to the Sprint 3+ SMS/worker provider before enabling real user sign-up delivery.

## Quality hooks

After `npm install`, Husky installs the repository-local pre-commit hook. It runs lint-staged, which formats and lints changed TypeScript files. Commit the generated `package-lock.json` once dependencies are installed; this workspace could not generate it because the local disk is full.
