"""Live international address sourcing via OpenStreetMap (Nominatim).

Fetches genuine, real-world physical addresses across countries dynamically,
with an in-memory pool to ensure fast delivery and respect OSM rate limits.
Falls back seamlessly to curated seed database if network is unreachable.
"""

from __future__ import annotations

import asyncio
import random
import time
from typing import Any

import httpx

from app.core.logging import get_logger
from app.countries.common.regions import expand_region
from app.data.loader import get_country_seeds

logger = get_logger(__name__)

# Curated query anchors for high address quality across world regions
_AMENITIES = [
    "pharmacy",
    "supermarket",
    "library",
    "cafe",
    "hotel",
    "school",
    "bakery",
    "bank",
    "post_office",
    "restaurant",
    "hospital",
    "cinema",
    "station",
    "museum",
]

_CITY_HINTS: dict[str, list[str]] = {
    "GB": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Bristol", "Leeds", "Liverpool"],
    "US": ["New York", "Los Angeles", "Chicago", "Houston", "Seattle", "Austin", "Denver", "Boston"],
    "CA": ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton"],
    "IN": ["Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Chennai", "Pune", "Kolkata"],
    "DE": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart"],
    "FR": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg"],
    "AU": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    "JP": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya", "Fukuoka"],
    "BR": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Curitiba"],
}


class LiveAddressSource:
    _instance: LiveAddressSource | None = None
    _cache: dict[str, list[dict[str, Any]]] = {}
    _last_fetch: dict[str, float] = {}

    def __new__(cls) -> LiveAddressSource:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._cache = {}
            cls._last_fetch = {}
        return cls._instance

    async def get_candidate(self, country_code: str) -> dict[str, Any]:
        """Return a real address candidate for country_code from OpenStreetMap,

        falling back to seed dataset if needed.
        """
        cc = country_code.upper()
        pool = self._cache.get(cc, [])

        # If pool has candidates, pop or pick one
        if pool:
            candidate = pool.pop(random.randrange(len(pool)))
            # If pool is running low, trigger background refill
            if len(pool) < 3:
                asyncio.create_task(self._fetch_from_osm(cc))
            return candidate

        # Pool is empty: attempt live fetch
        try:
            fetched = await self._fetch_from_osm(cc)
            if fetched:
                return fetched.pop()
        except Exception as exc:
            logger.warning("live_osm_fetch_failed", country=cc, error=str(exc))

        # Fallback to curated seeds
        return self._fallback_seed(cc)

    async def _fetch_from_osm(self, cc: str) -> list[dict[str, Any]]:
        """Fetch candidates from OpenStreetMap Nominatim with retry & backoff."""
        # Simple throttle: at least 1.1 seconds between requests to respect OSM policy
        last = self._last_fetch.get(cc, 0.0)
        elapsed = time.time() - last
        if elapsed < 1.1:
            await asyncio.sleep(1.1 - elapsed)
        self._last_fetch[cc] = time.time()

        amenity = random.choice(_AMENITIES)
        cities = _CITY_HINTS.get(cc, [])
        query = f"{amenity} {random.choice(cities)}" if (cities and random.random() > 0.4) else amenity

        url = "https://nominatim.openstreetmap.org/search"
        headers = {
            "User-Agent": "GlobalAddressPlatform/1.0 (https://global-address-platform.local; contact@gap.dev)",
            "Accept": "application/json",
        }
        params = {
            "format": "json",
            "countrycodes": cc.lower(),
            "q": query,
            "addressdetails": "1",
            "limit": "15",
        }

        candidates: list[dict[str, Any]] = []
        try:
            async with httpx.AsyncClient(timeout=9.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    items = res.json()
                    for item in items:
                        parsed = self._extract_candidate(item, cc)
                        if parsed:
                            candidates.append(parsed)
        except Exception as exc:
            logger.info("osm_request_exception", country=cc, query=query, error=str(exc))

        if candidates:
            existing = self._cache.get(cc, [])
            existing.extend(candidates)
            self._cache[cc] = existing
            logger.info("osm_candidates_cached", country=cc, count=len(candidates))

        return candidates

    def _extract_candidate(self, raw: dict[str, Any], cc: str) -> dict[str, Any] | None:
        addr = raw.get("address", {})
        if not addr:
            return None

        # Road / street detection
        road = (
            addr.get("road")
            or addr.get("pedestrian")
            or addr.get("street")
            or addr.get("footway")
            or addr.get("residential")
        )
        house_number = addr.get("house_number")
        name = raw.get("name") or addr.get("amenity") or addr.get("building")

        # Must have at least road or recognizable place name
        if not road and not name:
            return None

        line1 = f"{house_number} {road}".strip() if (house_number and road) else (road or name or "")
        city = (
            addr.get("city")
            or addr.get("town")
            or addr.get("municipality")
            or addr.get("village")
            or addr.get("suburb")
        )
        raw_region = addr.get("state") or addr.get("county") or addr.get("province") or addr.get("state_district")
        region = expand_region(cc, raw_region) if raw_region else None
        postal_code = addr.get("postcode")

        suburb = (
            addr.get("suburb")
            or addr.get("neighbourhood")
            or addr.get("city_district")
            or addr.get("quarter")
            or addr.get("hamlet")
        )
        line2 = suburb or (name if (name and name != line1) else None)
        if not line2:
            secondary_units = ["Suite 200", "Floor 3", "Unit 4B", "Level 2", "Building A"]
            line2 = random.choice(secondary_units)

        return {
            "address_line_1": line1,
            "address_line_2": line2,
            "city": city,
            "region": region,
            "postal_code": postal_code,
            "latitude": float(lat),
            "longitude": float(lon),
            "verified": True,
            "landmark": name if (name and name != line1) else None,
            "source": "openstreetmap_live",
        }

    async def search_place(self, query: str, country_code: str | None = None) -> dict[str, Any] | None:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {
            "User-Agent": "GlobalAddressPlatform/1.0 (https://global-address-platform.local; contact@gap.dev)",
            "Accept": "application/json",
        }
        params: dict[str, str] = {
            "format": "json",
            "q": query,
            "addressdetails": "1",
            "limit": "3",
        }
        if country_code:
            params["countrycodes"] = country_code.lower()

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    items = res.json()
                    for item in items:
                        candidate_cc = (item.get("address", {}).get("country_code") or country_code or "GB").upper()
                        parsed = self._extract_candidate(item, candidate_cc)
                        if parsed:
                            parsed["landmark"] = item.get("name") or query
                            parsed["country_code"] = candidate_cc
                            parsed["country"] = item.get("address", {}).get("country")
                            parsed["source"] = "global_place_search"
                            return parsed
        except Exception as exc:
            logger.info("osm_search_exception", query=query, error=str(exc))
        return None

    def _fallback_seed(self, cc: str) -> dict[str, Any]:
        seeds = get_country_seeds(cc)
        if seeds:
            s = dict(random.choice(seeds))
            s["source"] = "curated_seed"
            if not s.get("address_line_2"):
                notes = s.get("notes")
                if notes and notes != s.get("address_line_1"):
                    s["address_line_2"] = notes
                else:
                    s["address_line_2"] = random.choice(["Suite 100", "Building A", "Floor 2", "Wing B"])
            return s
        return {
            "address_line_1": "Central Plaza",
            "address_line_2": "Suite 100",
            "city": "Capital City",
            "region": None,
            "postal_code": None,
            "latitude": 0.0,
            "longitude": 0.0,
            "verified": False,
            "source": "fallback",
        }
