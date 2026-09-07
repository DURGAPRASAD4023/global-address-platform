from fastapi import APIRouter

from app.api.v1 import (
    batches,
    countries,
    export,
    generate,
    geocode,
    health,
    maps,
    normalize,
    validate,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(countries.router, prefix="/countries", tags=["countries"])
api_router.include_router(generate.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(validate.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(normalize.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(geocode.router, prefix="/addresses", tags=["addresses"])
api_router.include_router(maps.router, prefix="/maps", tags=["maps"])
api_router.include_router(export.router, prefix="/addresses", tags=["export"])
api_router.include_router(batches.router, tags=["batches"])
