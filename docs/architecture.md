# Architecture

## Product principle

Users select a **country** (or paste raw address text). The platform owns country-specific
structure, formatting, validation, geocoding, and map verification. Correctness beats speed.
Geocoded ≠ deliverable. Never hallucinate corrections.

## Monorepo layout

```text
global-address-platform/
├── frontend/          Next.js App Router UI
├── backend/           FastAPI + country adapters
├── data-pipeline/     Separate ingestion ETL
├── database/          PostGIS bootstrap SQL
├── docs/              Product & engineering docs
├── infrastructure/    Deployment notes
└── docker-compose.yml Local stack
```

## Runtime topology

```text
Browser → Next.js → FastAPI → PostgreSQL/PostGIS
                           ↘ Redis (cache / jobs)
                           ↘ GeocodingProvider adapters
```

## Layered backend

```text
API → Service → Repository → Database
         ↘ CountryRegistry → CountryAddressAdapter
         ↘ GeocodingProvider
         ↘ MapService
```

Country-specific logic **must** live in `backend/app/countries/<cc>/`.
Core services orchestrate; they must not contain `if country == ...` rule trees.

## Generation pipeline

```text
Country → Adapter → Rules + Dataset → Candidate → Format → Validate
       → Geocode → Map verify → Return OR discard & retry
```

## Validation pipeline

```text
Country + raw text → Parse → Normalize → Validate → Geocode → Map verify
                  → Standardized address OR low-confidence failure
```

## Verification statuses (distinct)

| Status | Meaning |
|--------|---------|
| Generated | Candidate constructed |
| Format valid | Matches country format rules |
| Postal valid | Postal pattern / dataset match |
| Geographic valid | Components consistent |
| Geocoded | Provider returned coordinates |
| Map verified | Location consistent with map evidence |
| Deliverability verified | Authoritative deliverability source only |

## Extensibility

- New country: implement `CountryAddressAdapter`, register, add tests + dataset metadata.
- New geocoder: implement `GeocodingProvider`.
- Bulk jobs: enqueue via Redis worker (Phase 9).

## Deployment (portable)

- Frontend: Vercel
- Backend: Render
- DB: Supabase PostgreSQL + PostGIS
- Redis: when jobs required

Code must not hard-depend on vendor-specific features.
