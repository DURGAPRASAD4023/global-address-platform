# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email maintainers with:

- description of the issue
- steps to reproduce
- potential impact
- suggested fix (optional)

We aim to acknowledge reports within 5 business days.

## Secrets

Never commit:

- `DATABASE_PASSWORD` / `DATABASE_URL` with real credentials
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEOCODING_API_KEY`
- `SECRET_KEY`
- API keys or tokens of any kind

Use `.env` locally (gitignored) and secret stores in deployment.
