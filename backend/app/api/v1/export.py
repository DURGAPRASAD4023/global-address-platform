"""Export API placeholders."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.exceptions import AppError

router = APIRouter()


class ExportRequest(BaseModel):
    format: str = Field(..., pattern="^(csv|json)$")
    address_ids: list[str] = Field(default_factory=list)


@router.post("/export")
async def export_addresses(body: ExportRequest) -> dict[str, object]:
    raise AppError(
        "NOT_IMPLEMENTED",
        "Export is scheduled for Phase 8. Generation/validation endpoints are available.",
        status_code=501,
        details={"format": body.format},
    )
