# Deployment

Target: Vercel (frontend) + Render (backend) + Supabase PostGIS (+ Redis when needed).

Keep configuration portable via `DATABASE_URL`, `REDIS_URL`, `GEOCODING_*`, and
`NEXT_PUBLIC_API_URL`.
