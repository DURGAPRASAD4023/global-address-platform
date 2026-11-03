#!/usr/bin/env bash
# prestart.sh — Run Alembic migrations with retry logic.
# Render services may start before the database DNS is fully resolvable,
# so we retry a few times with backoff.

set -e

MAX_RETRIES=5
RETRY_DELAY=3

for i in $(seq 1 $MAX_RETRIES); do
    echo "Running Alembic migrations (attempt $i/$MAX_RETRIES)..."
    if alembic upgrade head; then
        echo "Migrations completed successfully."
        exit 0
    fi
    if [ "$i" -lt "$MAX_RETRIES" ]; then
        echo "Migration failed. Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
        RETRY_DELAY=$((RETRY_DELAY * 2))
    fi
done

echo "ERROR: Migrations failed after $MAX_RETRIES attempts."
exit 1
