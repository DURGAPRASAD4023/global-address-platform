"""Geocoding provider abstraction."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.core.config import settings
from app.core.exceptions import AppError
from app.geocoding.base import GeocodingProvider, GeocodingResult
from app.geocoding.nominatim import NominatimProvider


class GeocodingService:
    def __init__(self, provider: GeocodingProvider | None = None) -> None:
        self.provider = provider or self._default_provider()

    def _default_provider(self) -> GeocodingProvider:
        name = settings.geocoding_provider.lower()
        if name in {"nominatim", "osm"}:
            return NominatimProvider(
                user_agent=settings.geocoding_user_agent,
                api_key=settings.geocoding_api_key or None,
            )
        raise AppError(
            "GEOCODING_PROVIDER_UNKNOWN",
            f"Unknown geocoding provider '{settings.geocoding_provider}'.",
            status_code=500,
        )

    async def geocode(self, address: str, country: str | None = None) -> dict[str, Any]:
        result = await self.provider.geocode(address, country_code=country)
        return result.model_dump()


# Re-export for type checkers / convenience
__all__ = ["GeocodingService", "GeocodingProvider", "GeocodingResult", "ABC", "abstractmethod"]
