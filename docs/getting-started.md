# Getting started

## Prerequisites

- Docker & Docker Compose
- (Optional) Node 22+, Python 3.12+ for local non-Docker work

## Run the stack

```bash
cp .env.example .env
docker compose up --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000 |
| OpenAPI  | http://localhost:8000/docs |
| Postgres | localhost:5432 |
| Redis    | localhost:6379 |

## Migrate database

```bash
docker compose exec backend alembic upgrade head
```

## Tests

```bash
docker compose exec backend pytest -q
docker compose exec frontend npm test
```

## Phase 1 status

Foundation only: health, country catalog (60 planned markets), base adapter interface,
map link service, Docker, CI skeletons. Full generation for US/GB/CA/BR/IN is Phase 3–4.
