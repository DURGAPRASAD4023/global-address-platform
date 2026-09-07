"""Export service placeholder — Phase 8."""

from app.core.exceptions import AppError


class ExportService:
    def export(self, fmt: str, records: list[dict]) -> bytes:
        raise AppError(
            "NOT_IMPLEMENTED",
            "Export service lands in Phase 8.",
            status_code=501,
            details={"format": fmt, "count": len(records)},
        )
