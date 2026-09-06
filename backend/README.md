# Chamber Management backend

Sprint 1 establishes the NestJS/Fastify, PostgreSQL, Prisma, and Redis foundation. Domain modules (authentication, users, chambers, and clinical workflows) are deliberately not included yet.

## Prerequisites

- Node.js 22+
- npm 10+
- Docker Desktop (for PostgreSQL and Redis)

## Run with Docker

From this directory:

```bash
docker compose up --build
```

The API waits for PostgreSQL and Redis before starting. Open:

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

## Quality hooks

After `npm install`, Husky installs the repository-local pre-commit hook. It runs lint-staged, which formats and lints changed TypeScript files. Commit the generated `package-lock.json` once dependencies are installed; this workspace could not generate it because the local disk is full.
