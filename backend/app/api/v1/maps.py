"""Map link helpers API."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.map_service import MapService

router = APIRouter()


class MapLinksRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    label: str | None = None


@router.post("/links")
async def map_links(body: MapLinksRequest) -> dict[str, object]:
    links = MapService().links(body.latitude, body.longitude, label=body.label)
    return {"success": True, "data": {"map_links": links}}
