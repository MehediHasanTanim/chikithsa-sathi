# Chamber Management backend

Sprints 1–2 establish the NestJS/Fastify, PostgreSQL, Prisma, and Redis foundation plus secure account authentication. Clinical and chamber-domain modules are deliberately not included yet.

## Prerequisites

- Node.js 22+
- npm 10+
- Docker Desktop (for the complete local stack)

## Run with Docker

From this directory, optionally create the Docker environment file first:

```bash
cp .env.docker.example .env
docker compose up --build -d
docker compose ps
```

Compose starts PostgreSQL, Redis (with AOF persistence), a one-shot Prisma migration job, and the API. The API starts only after the migration succeeds and Redis is healthy. Open:

- `http://localhost:3000/health/live` — process liveness only
- `http://localhost:3000/health/ready` — PostgreSQL and Redis readiness
- `http://localhost:3000/health` — aggregate health
- `http://localhost:3000/api/docs` — OpenAPI UI (enabled by default outside production)

Useful operations:

```bash
docker compose logs -f api
docker compose logs migrate
docker compose down
```

`docker compose down -v` additionally removes the persisted PostgreSQL and Redis volumes.

PostgreSQL is published on host port `5433` by default to avoid a conflict with a locally installed PostgreSQL server; containers continue to use `postgres:5432` internally. Set `POSTGRES_PORT` in `.env` to choose another host port.

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

## Production hardening

Production startup rejects development or short JWT secrets. Configure distinct 64+ character access and refresh secrets through your secret manager; never use `.env` files as a production secret store. Swagger is disabled unless explicitly enabled. If `CORS_ORIGINS` is configured, every production origin must use HTTPS.

All non-health HTTP routes have a Redis-backed per-IP limit (`API_RATE_LIMIT_MAX` requests per `API_RATE_LIMIT_WINDOW_SECONDS`). Authentication has stricter independent limits. Health probes are deliberately excluded so orchestration remains reliable during client traffic spikes.

Set `METRICS_TOKEN` to expose Prometheus metrics at `GET /api/metrics`; send it as `Authorization: Bearer <token>`. Without this secret the endpoint returns 404. Metrics aggregate route templates, status codes, and latency only—never request bodies, query strings, patient IDs, or tokens.

### Prometheus and alerting

The optional Compose `observability` profile runs Prometheus and Alertmanager. Prometheus is bound to loopback only, scrapes the API over the internal Docker network, and reads the bearer token from a Docker secret rather than its configuration. Alertmanager requires an HTTPS webhook URL for your incident-management or notification service.

Before enabling the profile, create a high-entropy token, store the same value in `.env` as `METRICS_TOKEN`, and put it in the ignored secret file. Also place the HTTPS Alertmanager-compatible webhook URL in its ignored secret file:

```bash
umask 077
openssl rand -hex 32 > docker/prometheus/metrics-token
printf '%s' 'https://alerts.example.com/alertmanager/webhook' > docker/alertmanager/alert-webhook-url
# Copy the file's value into METRICS_TOKEN in your secret manager or local .env.
```

Then start the stack:

```bash
docker compose --profile observability up --build -d
curl -fsS http://127.0.0.1:9090/api/v1/targets
```

Prometheus evaluates target-down, 5xx-rate, and latency alerts. Alertmanager sends both firing and resolved events to the configured webhook. In managed production, use the equivalent platform secrets for the metrics token and webhook URL; do not publish ports 9090 or 9093 to the public internet.

Before a production deployment, run:

```bash
npm run audit:prod
npm run lint
npm run build
npm run test:infra
```

Apply migrations through the one-shot `migrate` service before starting the API. Roll back application images only when the migration is backward compatible; otherwise deploy a forward corrective migration. Validate disaster recovery in a separate environment by restoring a tested PostgreSQL backup, applying the image/migrations, checking Redis recovery, then verifying an authorized file download.

## Conventions introduced in Sprint 1

- API success: `{ success, data, meta: { requestId } }`
- API error: `{ success: false, error: { code, message, details }, requestId }`
- Request IDs: accepts or creates `x-request-id` and returns it in the response.
- Redis keys: services call `redis.key(domain, key)`; ioredis applies the `cm:{environment}:` prefix.
- Pagination: `toOffsetPagination(page, limit)` clamps input and returns Prisma-ready `skip`/`take`.
- Bangladesh phones: `isBangladeshPhone` accepts `01XXXXXXXXX`, `8801XXXXXXXXX`, and `+8801XXXXXXXXX` formats.

## Authentication API

All product routes are versioned under `/api/v1`.

| Method    | Path               | Purpose                                                    |
| --------- | ------------------ | ---------------------------------------------------------- |
| POST      | `/auth/register`   | Creates a pending account and OTP challenge.               |
| POST      | `/auth/verify-otp` | Activates the account after a valid OTP.                   |
| POST      | `/auth/resend-otp` | Replaces an unconsumed OTP after its cooldown.             |
| POST      | `/auth/login`      | Creates a device-aware session and returns token pair.     |
| POST      | `/auth/refresh`    | Rotates the refresh token and invalidates its predecessor. |
| POST      | `/auth/logout`     | Requires an access token and revokes its session.          |
| GET/PATCH | `/users/me`        | Reads or updates the authenticated user profile.           |

Passwords and OTPs are Argon2id hashes; raw values are never persisted or logged. Refresh tokens are also stored only as hashes. JWT payloads contain only the user ID, session ID, token version, and token type. Set distinct high-entropy JWT secrets before deploying; development-only values in `.env.example` are rejected in production.

Login is limited to five requests per minute per phone/IP pair. Registration, OTP verification, and OTP resend are limited to five requests per ten minutes; registration OTPs expire after ten minutes, permit five attempts, and resends have a 60-second cooldown. An account is locked for 15 minutes after five failed password attempts. These values are configured through `.env`.

Registration requires an email address. Set `EMAIL_ENABLED=true`, `EMAIL_FROM`, and the `EMAIL_SMTP_*` variables for a TLS-capable SMTP relay. The service verifies SMTP connectivity at startup, sends a six-digit OTP email on registration/resend, and logs neither OTP codes nor recipient addresses. Production startup rejects disabled or incomplete email configuration.

## Quality hooks

After `npm install`, Husky installs the repository-local pre-commit hook. It runs lint-staged, which formats and lints changed TypeScript files. Commit the generated `package-lock.json` once dependencies are installed; this workspace could not generate it because the local disk is full.
