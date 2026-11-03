#!/usr/bin/env bash
# prestart.sh — Run Alembic migrations with retry logic.
# If the database is unreachable, log a warning and let the server start
# so Render detects the open port and doesn't restart-loop the service.

MAX_RETRIES=3
RETRY_DELAY=3

# Log the database host being targeted (mask credentials).
if [ -n "$DATABASE_URL" ]; then
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
    echo "Database host: $DB_HOST"
else
    echo "WARNING: DATABASE_URL is not set! Skipping migrations."
    exit 0
fi

for i in $(seq 1 $MAX_RETRIES); do
    echo "Running Alembic migrations (attempt $i/$MAX_RETRIES)..."
    if alembic upgrade head 2>&1; then
        echo "Migrations completed successfully."
        exit 0
    fi
    if [ "$i" -lt "$MAX_RETRIES" ]; then
        echo "Migration failed. Retrying in ${RETRY_DELAY}s..."
        sleep $RETRY_DELAY
        RETRY_DELAY=$((RETRY_DELAY * 2))
    fi
done

echo "WARNING: Migrations failed after $MAX_RETRIES attempts. Starting server anyway."
echo "The app will start but database-dependent endpoints will not work until DATABASE_URL is correctly configured."
exit 0

