"""Address generation API — request: { \"country\": \"GB\", \"source\": \"live\" }."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.exceptions import AppError
from app.services.generation_service import GenerationService

router = APIRouter()


class GenerateRequest(BaseModel):
    country: str = Field(..., min_length=2, max_length=2, examples=["GB"])
    source: str = Field("live", description="Source of address: 'live' (OpenStreetMap) or 'seed' (curated)")


class SearchPlaceRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Place or landmark name to search")
    country: str | None = Field(None, description="Optional ISO country code filter")


@router.post("/generate")
async def generate_address(body: GenerateRequest) -> dict[str, object]:
    service = GenerationService(max_retries=settings.generation_max_retries)
    try:
        result = await service.generate(body.country.upper(), source=body.source)
    except AppError:
        raise
    except NotImplementedError as exc:
        raise AppError("COUNTRY_NOT_IMPLEMENTED", str(exc), status_code=501) from exc
    return {"success": True, "data": result.model_dump()}


@router.post("/search")
async def search_place(body: SearchPlaceRequest) -> dict[str, object]:
    service = GenerationService(max_retries=settings.generation_max_retries)
    try:
        result = await service.search_place(body.query, country_code=body.country)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("PLACE_SEARCH_FAILED", str(exc), status_code=500) from exc
    return {"success": True, "data": result.model_dump()}

