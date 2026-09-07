# API

Base prefix: `/api/v1`

| Method | Path | Status |
|--------|------|--------|
| GET | /health | Foundation |
| GET | /countries | Foundation |
| GET | /countries/{code} | Foundation |
| POST | /addresses/generate | Stub (501 until adapters) |
| POST | /addresses/parse | Stub until adapters |
| POST | /addresses/validate | Stub until adapters |
| POST | /addresses/normalize | Stub until adapters |
| POST | /addresses/geocode | Nominatim wired |
| POST | /addresses/bulk-validate | 501 (workers) |
| POST | /addresses/export | 501 (Phase 8) |
| GET | /batches/{id} | 501 (Phase 9) |
| POST | /maps/links | Foundation |

Interactive docs: `/docs`.
