-- Enable PostGIS for local development
-- Runs automatically via docker-entrypoint-initdb.d

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON EXTENSION postgis IS 'Spatial types and indexes for address geocoding verification';
