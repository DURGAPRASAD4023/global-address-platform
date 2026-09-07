# Address validation

```http
POST /api/v1/addresses/validate
{ "country": "GB", "address": "raw text" }
```

Parse raw text automatically. Correct only with high confidence. Never hallucinate.
