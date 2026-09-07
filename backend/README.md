# Backend

FastAPI + SQLAlchemy + Alembic service for address generation, parsing, validation,
normalization, geocoding, and export.

## Local (without Docker)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

## Tests

```bash
pytest -q
```
