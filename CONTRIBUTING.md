# Contributing

Thank you for contributing to the Global Address Intelligence & Testing Platform.

## Principles

1. **Correctness over speed** — never return unverified addresses as verified.
2. **No hallucination** — do not invent streets, postal codes, or corrections.
3. **Country adapters** — country-specific logic lives in `backend/app/countries/<cc>/`.
4. **Data licensing** — never commit proprietary datasets or scrape against Terms of Service.
5. **Privacy** — do not permanently store raw user addresses by default.

## Development workflow

```bash
cp .env.example .env
docker compose up --build
```

Backend tests:

```bash
cd backend && pytest
```

Frontend tests:

```bash
cd frontend && npm test
```

## Adding a country

1. Create `backend/app/countries/<iso2>/` with adapter, parser, validator, formatter, rules.
2. Register the adapter in the country registry (auto-discovery preferred).
3. Add dataset metadata under `data-pipeline/configs/` (source, license, attribution).
4. Add the country test matrix (valid, invalid, postal, Unicode, local language, etc.).
5. Update docs and do **not** mark the country fully supported until tests pass.

See [docs/country-adapters.md](docs/country-adapters.md).

## Pull requests

- Keep PRs focused and runnable.
- Include tests for new behavior.
- Update documentation when behavior or APIs change.
- Ensure lint, typecheck, and tests pass in CI.

## Code of conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
