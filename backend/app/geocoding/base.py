"""Geocoding provider interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class GeocodingResult(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    formatted_address: str | None = None
    provider: str
    confidence: float | None = None  # only if provider supplies it — never invent
    provider_reference: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str  # success | not_found | error | rate_limited


class GeocodingProvider(ABC):
    name: str

    @abstractmethod
    async def geocode(
        self,
        address: str,
        *,
        country_code: str | None = None,
    ) -> GeocodingResult:
        ...

    @abstractmethod
    async def reverse_geocode(
        self,
        latitude: float,
        longitude: float,
    ) -> GeocodingResult:
        ...
