"""Background worker entrypoint (Phase 9 jobs)."""

from app.core.logging import configure_logging, get_logger


def main() -> None:
    configure_logging()
    logger = get_logger("worker")
    logger.info(
        "worker_idle",
        message=(
            "Worker container is reserved for bulk_generation, bulk_validation, "
            "bulk_geocoding, dataset_import, and large_export jobs."
        ),
    )
    # Keep process alive for docker compose profile; real queue consumer in Phase 9.
    import time

    while True:
        time.sleep(60)


if __name__ == "__main__":
    main()
