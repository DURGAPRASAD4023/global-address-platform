"""OSM Nominatim geocoding adapter — respect usage policy & attribution."""

from __future__ import annotations

import httpx

from app.geocoding.base import GeocodingProvider, GeocodingResult


class NominatimProvider(GeocodingProvider):
    name = "nominatim"
    base_url = "https://nominatim.openstreetmap.org"

    def __init__(self, user_agent: str, api_key: str | None = None) -> None:
        self.user_agent = user_agent
        self.api_key = api_key

    def _headers(self) -> dict[str, str]:
        return {"User-Agent": self.user_agent, "Accept": "application/json"}

    async def geocode(
        self,
        address: str,
        *,
        country_code: str | None = None,
    ) -> GeocodingResult:
        params: dict[str, str] = {"q": address, "format": "json", "limit": "1"}
        if country_code:
            params["countrycodes"] = country_code.lower()

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    params=params,
                    headers=self._headers(),
                )
        except httpx.HTTPError:
            return GeocodingResult(provider=self.name, status="error")

        if response.status_code == 429:
            return GeocodingResult(provider=self.name, status="rate_limited")
        if response.status_code >= 400:
            return GeocodingResult(provider=self.name, status="error")

        data = response.json()
        if not data:
            return GeocodingResult(provider=self.name, status="not_found")

        hit = data[0]
        return GeocodingResult(
            latitude=float(hit["lat"]),
            longitude=float(hit["lon"]),
            formatted_address=hit.get("display_name"),
            provider=self.name,
            confidence=None,  # Nominatim does not provide a reliable confidence score
            provider_reference=str(hit.get("place_id")) if hit.get("place_id") else None,
            status="success",
        )

    async def reverse_geocode(self, latitude: float, longitude: float) -> GeocodingResult:
        params = {"lat": str(latitude), "lon": str(longitude), "format": "json"}
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(
                    f"{self.base_url}/reverse",
                    params=params,
                    headers=self._headers(),
                )
        except httpx.HTTPError:
            return GeocodingResult(provider=self.name, status="error")

        if response.status_code >= 400:
            return GeocodingResult(provider=self.name, status="error")

        hit = response.json()
        if not hit or hit.get("error"):
            return GeocodingResult(provider=self.name, status="not_found")

        return GeocodingResult(
            latitude=latitude,
            longitude=longitude,
            formatted_address=hit.get("display_name"),
            provider=self.name,
            confidence=None,
            provider_reference=str(hit.get("place_id")) if hit.get("place_id") else None,
            status="success",
        )
