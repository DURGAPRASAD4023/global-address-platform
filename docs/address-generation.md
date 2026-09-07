# Address generation

Minimal API:

```http
POST /api/v1/addresses/generate
{ "country": "GB" }
```

Pipeline: adapter candidate → format/validate → geocode → map verify → retry if unverified.
Never return an unverified address as verified.
