"""Normalization API."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.normalization_service import NormalizationService

router = APIRouter()


class NormalizeRequest(BaseModel):
    country: str = Field(..., min_length=2, max_length=2)
    address: str = Field(..., min_length=1, max_length=4000)


@router.post("/normalize")
async def normalize_address(body: NormalizeRequest) -> dict[str, object]:
    result = NormalizationService().normalize(body.country.upper(), body.address)
    return {"success": True, "data": result}
