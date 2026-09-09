# ChamberCare web app

The Next.js frontend for Chamber Management. Sprint 1 provides the responsive application shell, shared UI foundation, localization/theme state, and REST/query infrastructure.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3001` if the NestJS API is already using port 3000 (or allow Next.js to choose its displayed port). The API defaults to `http://localhost:3000/api/v1`.

## Checks

```bash
npm run lint
npm run build
npm run format:check
```

Server state belongs in TanStack Query; cross-cutting client state lives in `src/stores`. New features should follow the feature-first structure in `src/features` and call typed repositories rather than `fetch` directly from components.

## Docker

The production container listens on port `3000` internally and binds to `127.0.0.1:3001` by default, avoiding the NestJS API's default host port.

```bash
docker compose up --build
```

Open `http://localhost:3001`. Set `WEB_PORT` to select another host port, and set `NEXT_PUBLIC_API_BASE_URL` at build time if the browser must use a different API URL. When using the local API, ensure its `CORS_ORIGINS` includes `http://localhost:3001`.
