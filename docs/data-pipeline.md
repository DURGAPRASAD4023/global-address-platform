# Data pipeline

See `data-pipeline/README.md`.

Ingestion runs separately from the API. Load targets PostgreSQL/PostGIS after
download → parse → clean → normalize → dedupe → validate.
