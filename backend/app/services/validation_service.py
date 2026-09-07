"""Validation service — parse -> normalize -> validate -> geocode / seed verify."""

from __future__ import annotations

import asyncio
from typing import Any

from app.countries.base.schemas import Coordinates
from app.countries.registry import CountryRegistry
from app.core.exceptions import AppError
from app.data.loader import get_country_seeds
from app.services.geocoding_service import GeocodingService
from app.services.map_service import MapService


class ValidationService:
    async def validate(self, country_code: str, raw_address: str) -> dict[str, Any]:
        adapter = CountryRegistry.get(country_code)
        # Planned adapters raise AppError with 501 — surface cleanly.
        try:
            parsed = adapter.parse(raw_address.strip())
            normalized = adapter.normalize(parsed)
            validation = adapter.validate(normalized)
            formatted = adapter.format(normalized)
        except AppError:
            raise

        coords: Coordinates | None = None
        map_links: dict[str, str] = {}
        matched_seed: dict[str, Any] | None = None

        # 1. Check curated seed locations for immediate match (e.g. British Museum, White House, etc.)
        seeds = get_country_seeds(country_code)
        norm_postal = (normalized.postal_code or "").strip().upper().replace(" ", "")
        norm_city = (normalized.city or "").strip().lower()
        norm_line1 = (normalized.address_line_1 or "").strip().lower()

        for s in seeds:
            s_postal = (s.get("postal_code") or "").strip().upper().replace(" ", "")
            s_city = (s.get("city") or "").strip().lower()
            s_line1 = (s.get("address_line_1") or "").strip().lower()

            postal_match = bool(norm_postal and s_postal and norm_postal == s_postal)
            city_match = bool(norm_city and s_city and norm_city == s_city)
            line_match = bool(norm_line1 and s_line1 and (norm_line1 in s_line1 or s_line1 in norm_line1))

            if (postal_match and (city_match or line_match)) or (line_match and city_match):
                matched_seed = s
                break

        if matched_seed and matched_seed.get("latitude") is not None and matched_seed.get("longitude") is not None:
            lat = float(matched_seed["latitude"])
            lon = float(matched_seed["longitude"])
            coords = Coordinates(latitude=lat, longitude=lon)
            map_links = MapService().links(lat, lon, label=formatted)
            validation.geocoded = True
            validation.map_verified = True
            validation.geographic_valid = True
        else:
            # 2. Attempt geocoding via configured provider (Nominatim/OSM) with 3s timeout
            try:
                geocode_query = f"{normalized.address_line_1 or ''}, {normalized.city or ''} {normalized.postal_code or ''}".strip(" ,")
                if not geocode_query:
                    geocode_query = formatted
                geo_task = GeocodingService().geocode(geocode_query, country=country_code)
                geo = await asyncio.wait_for(geo_task, timeout=3.0)
                if geo.get("status") == "success" and geo.get("latitude") and geo.get("longitude"):
                    lat = float(geo["latitude"])
                    lon = float(geo["longitude"])
                    coords = Coordinates(latitude=lat, longitude=lon)
                    map_links = MapService().links(lat, lon, label=formatted)
                    validation.geocoded = True
                    validation.map_verified = True
                    validation.geographic_valid = True
            except Exception:
                # Soft failure: validation succeeds even if geocoder is unreachable
                pass

        return {
            "original_address": raw_address,
            "parsed_address": parsed.model_dump(),
            "standardized_address": {
                **normalized.model_dump(),
                "formatted_address": formatted,
            },
            "validation": validation.model_dump(),
            "coordinates": coords.model_dump() if coords else None,
            "map_links": map_links,
            "confidence": 1.0 if matched_seed else (0.9 if coords else 0.7 if validation.format_valid else 0.2),
            "notes": matched_seed.get("notes") if matched_seed else None,
            "message": (
                "Verified against curated geographic database."
                if matched_seed
                else (
                    "Geocoded and map-verified."
                    if coords
                    else "Format & postal rules verified. Deliverability verification requires national postal carrier registry (DPV/PAF)."
                )
            ),
        }
