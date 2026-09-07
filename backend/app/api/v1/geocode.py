"""Geocoding API."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.geocoding_service import GeocodingService

router = APIRouter()


class GeocodeRequest(BaseModel):
    country: str | None = Field(default=None, min_length=2, max_length=2)
    address: str = Field(..., min_length=1, max_length=4000)


@router.post("/geocode")
async def geocode_address(body: GeocodeRequest) -> dict[str, object]:
    result = await GeocodingService().geocode(body.address, country=body.country)
    return {"success": True, "data": result}
