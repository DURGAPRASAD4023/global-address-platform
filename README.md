# Global Address Intelligence & Testing Platform

Production-oriented open-source platform for **generating, parsing, validating, normalizing, geocoding, and map-verifying** international addresses.

> **Give us the country, and we handle the address complexity.**  
> **Give us a raw address, and we verify it against geographic evidence — without hallucinating corrections.**

## Status

**Phase 1 — Foundation** complete (scaffold).

| Area | State |
|------|--------|
| Monorepo + Docker Compose | Ready |
| FastAPI + health + OpenAPI | Ready |
| Country registry (60 markets) | Planned stubs |
| Base `CountryAddressAdapter` | Ready |
| Next.js Generate / Validate / Map UI | Shell ready |
| Nominatim geocoding adapter | Wired |
| Full US/GB/CA/BR/IN adapters | Next (Phase 3) |

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:8000  
- OpenAPI: http://localhost:8000/docs  

## Local development without Docker

Backend (PowerShell):

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

In a second terminal, start the frontend:

```powershell
cd frontend
npm install
$env:NEXT_PUBLIC_API_URL = "http://localhost:8000"
npm run dev
```

Open http://localhost:3000. The Address Lab and Testing workspace use the FastAPI endpoints at http://localhost:8000.

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend pytest -q
```

## Core UX

**Generate** — select country → generate → validate → geocode → map verify  

**Validate** — select country → paste raw address → parse → normalize → verify  

Verification statuses are **separate**: format, postal, geographic, geocoded, map verified, deliverability (never implied by geocoding alone).

## Architecture

See [docs/architecture.md](docs/architecture.md) and [docs/getting-started.md](docs/getting-started.md).

```text
API → Service → Repository → Database
        ↘ CountryRegistry → CountryAddressAdapter
        ↘ GeocodingProvider
        ↘ MapService
```

## License

Apache-2.0 — see [LICENSE](LICENSE).

## Security

Report vulnerabilities per [SECURITY.md](SECURITY.md). Never commit secrets or proprietary datasets.
