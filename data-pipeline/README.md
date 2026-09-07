# Data pipeline

Ingestion is **separate** from the API application.

```text
Source → Download → Parse → Clean → Normalize → Deduplicate → Validate → Load PostgreSQL/PostGIS
```

## Structure

```text
data-pipeline/
├── sources/       # Source registry metadata
├── downloaders/   # Licensed download clients
├── parsers/       # Format-specific parsers
├── processors/    # Clean / normalize / dedupe
├── validators/    # Data quality checks
├── loaders/       # PostgreSQL/PostGIS loaders
├── configs/       # Per-dataset configs (license, attribution)
└── README.md
```

## Rules

- Do **not** scrape sites in violation of Terms of Service.
- Do **not** commit large datasets into Git.
- Every dataset must document: source, license, version, coverage, download date,
  attribution requirements, redistribution permissions.
