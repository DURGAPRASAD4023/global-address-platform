"""Address parse / validate / bulk-validate API."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.exceptions import AppError
from app.services.parsing_service import ParsingService
from app.services.validation_service import ValidationService

router = APIRouter()


class AddressTextRequest(BaseModel):
    country: str = Field(..., min_length=2, max_length=2)
    address: str = Field(..., min_length=1, max_length=4000)


class BulkValidateRequest(BaseModel):
    country: str = Field(..., min_length=2, max_length=2)
    addresses: list[str] = Field(..., min_length=1, max_length=100)


@router.post("/parse")
async def parse_address(body: AddressTextRequest) -> dict[str, object]:
    if len(body.address) > settings.max_address_input_chars:
        raise AppError("INPUT_TOO_LARGE", "Address exceeds maximum allowed length.")
    parsed = ParsingService().parse(body.country.upper(), body.address)
    return {"success": True, "data": {"parsed_address": parsed.model_dump()}}


@router.post("/validate")
async def validate_address(body: AddressTextRequest) -> dict[str, object]:
    if len(body.address) > settings.max_address_input_chars:
        raise AppError("INPUT_TOO_LARGE", "Address exceeds maximum allowed length.")
    result = await ValidationService().validate(body.country.upper(), body.address)
    return {"success": True, "data": result}


@router.post("/bulk-validate")
async def bulk_validate(body: BulkValidateRequest) -> dict[str, object]:
    if len(body.addresses) > settings.max_bulk_size:
        raise AppError(
            "BULK_TOO_LARGE",
            f"Maximum bulk size is {settings.max_bulk_size}. Use background jobs for larger sets.",
        )
    # Large jobs must use workers — Phase 1 returns 501 for orchestration placeholder.
    raise AppError(
        "NOT_IMPLEMENTED",
        "Bulk validation will run via background workers. Use /validate for single addresses.",
        status_code=501,
    )
