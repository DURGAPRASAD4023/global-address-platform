"""Generation service — dynamic OpenStreetMap sourcing + curated seed fallback."""

from __future__ import annotations

from app.countries.base.schemas import AddressComponents, Coordinates, GeneratedAddress, ValidationStatus
from app.countries.registry import CountryRegistry
from app.core.exceptions import AppError
from app.core.logging import get_logger
from app.services.map_service import MapService

logger = get_logger(__name__)


class GenerationService:
    def __init__(self, max_retries: int = 5) -> None:
        self.max_retries = max_retries

    async def generate(self, country_code: str, source: str = "live") -> GeneratedAddress:
        adapter = CountryRegistry.get(country_code)

        # 1. Live dynamic sourcing via OpenStreetMap
        if source in {"live", "auto"}:
            try:
                from app.services.live_source_service import LiveAddressSource

                item = await LiveAddressSource().get_candidate(country_code)
                if item:
                    components = AddressComponents(
                        country=adapter.country_name,
                        country_code=adapter.country_code,
                        address_line_1=item.get("address_line_1"),
                        address_line_2=item.get("address_line_2"),
                        city=item.get("city"),
                        region=item.get("region"),
                        postal_code=item.get("postal_code"),
                        landmark=item.get("landmark"),
                    )
                    normalized = adapter.normalize(components)
                    validation = adapter.validate(normalized)
                    lat = item.get("latitude")
                    lon = item.get("longitude")
                    coords = (
                        Coordinates(latitude=lat, longitude=lon)
                        if (lat is not None and lon is not None)
                        else None
                    )
                    formatted = normalized.formatted_address or adapter.format(normalized)
                    is_live = item.get("source") == "openstreetmap_live"

                    return GeneratedAddress(
                        country=adapter.country_name,
                        country_code=adapter.country_code,
                        address_line_1=normalized.address_line_1 or "",
                        address_line_2=normalized.address_line_2,
                        city=normalized.city,
                        region=normalized.region,
                        postal_code=normalized.postal_code,
                        formatted_address=formatted,
                        coordinates=coords,
                        geocoding_provider="openstreetmap_live" if is_live else "curated_seed",
                        geocoding_status="verified",
                        map_verification_status="verified",
                        map_links=MapService().links(
                            coords.latitude, coords.longitude, label=formatted
                        )
                        if coords
                        else {},
                        validation=ValidationStatus(
                            format_valid=validation.format_valid,
                            postal_valid=validation.postal_valid,
                            geographic_valid=True if coords else validation.geographic_valid,
                            geocoded=bool(coords),
                            map_verified=bool(coords),
                            deliverability_verified=False,
                        ),
                        source="live_osm" if is_live else "curated_seed",
                        landmark=item.get("landmark"),
                    )
            except Exception as exc:
                logger.warning(
                    "live_generation_fallback_to_seed",
                    country=country_code,
                    error=str(exc),
                )

        # 2. Seed-backed generation fallback / explicit seed request
        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                candidate = await adapter.generate()
                candidate.source = "curated_seed"
            except AppError:
                raise
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "generation_attempt_failed",
                    country=country_code,
                    attempt=attempt,
                    error=str(exc),
                )
                continue

            if candidate.validation.geocoded and candidate.validation.map_verified:
                return candidate

        raise AppError(
            "ADDRESS_NOT_VERIFIED",
            "Could not generate a map-verified address within retry limits.",
            status_code=422,
            details={
                "country": country_code,
                "attempts": self.max_retries,
                "last_error": str(last_error),
            },
        )

    async def search_place(self, query: str, country_code: str | None = None) -> GeneratedAddress:
        clean_query = query.strip()
        if not clean_query:
            raise AppError("EMPTY_QUERY", "Search query cannot be empty.", status_code=422)

        from app.services.live_source_service import LiveAddressSource

        # 1. Live OpenStreetMap Search
        candidate = await LiveAddressSource().search_place(clean_query, country_code=country_code)
        if candidate:
            cc = candidate.get("country_code") or (country_code.upper() if country_code else "GB")
            adapter = CountryRegistry.get(cc)
            components = AddressComponents(
                country=candidate.get("country") or adapter.country_name,
                country_code=cc,
                address_line_1=candidate.get("address_line_1"),
                address_line_2=candidate.get("address_line_2"),
                city=candidate.get("city"),
                region=candidate.get("region"),
                postal_code=candidate.get("postal_code"),
                landmark=candidate.get("landmark"),
            )
            normalized = adapter.normalize(components)
            validation = adapter.validate(normalized)
            lat = candidate.get("latitude")
            lon = candidate.get("longitude")
            coords = Coordinates(latitude=lat, longitude=lon) if (lat is not None and lon is not None) else None
            formatted = normalized.formatted_address or adapter.format(normalized)

            return GeneratedAddress(
                country=normalized.country or adapter.country_name,
                country_code=cc,
                address_line_1=normalized.address_line_1 or "",
                address_line_2=normalized.address_line_2,
                city=normalized.city,
                region=normalized.region,
                postal_code=normalized.postal_code,
                formatted_address=formatted,
                coordinates=coords,
                geocoding_provider="openstreetmap_nominatim",
                geocoding_status="verified",
                map_verification_status="verified",
                map_links=MapService().links(coords.latitude, coords.longitude, label=formatted) if coords else {},
                validation=ValidationStatus(
                    format_valid=True,
                    postal_valid=validation.postal_valid,
                    geographic_valid=True,
                    geocoded=bool(coords),
                    map_verified=bool(coords),
                    deliverability_verified=False,
                ),
                source="global_place_search",
                landmark=candidate.get("landmark") or clean_query,
            )

        # 2. Curated Seed Search Fallback
        from app.data.loader import load_seed_file
        all_seeds = load_seed_file()
        q_lower = clean_query.lower()
        matched_seed = None
        seed_cc = None

        for cc_key, cc_data in all_seeds.get("countries", {}).items():
            if country_code and cc_key.upper() != country_code.upper():
                continue
            for loc in cc_data.get("locations", []):
                notes = (loc.get("notes") or "").lower()
                l1 = (loc.get("address_line_1") or "").lower()
                c = (loc.get("city") or "").lower()
                if q_lower in notes or notes in q_lower or q_lower in l1 or q_lower in c:
                    matched_seed = loc
                    seed_cc = cc_key
                    break
            if matched_seed:
                break

        if matched_seed and seed_cc:
            adapter = CountryRegistry.get(seed_cc)
            line2 = matched_seed.get("address_line_2") or matched_seed.get("notes")
            components = AddressComponents(
                country=adapter.country_name,
                country_code=seed_cc,
                address_line_1=matched_seed.get("address_line_1"),
                address_line_2=line2,
                city=matched_seed.get("city"),
                region=matched_seed.get("region"),
                postal_code=matched_seed.get("postal_code"),
                landmark=matched_seed.get("notes"),
            )
            normalized = adapter.normalize(components)
            coords = Coordinates(latitude=float(matched_seed["latitude"]), longitude=float(matched_seed["longitude"])) if matched_seed.get("latitude") else None
            formatted = normalized.formatted_address or adapter.format(normalized)
            return GeneratedAddress(
                country=adapter.country_name,
                country_code=seed_cc,
                address_line_1=normalized.address_line_1 or "",
                address_line_2=normalized.address_line_2,
                city=normalized.city,
                region=normalized.region,
                postal_code=normalized.postal_code,
                formatted_address=formatted,
                coordinates=coords,
                geocoding_provider="curated_seed",
                geocoding_status="verified",
                map_verification_status="verified",
                map_links=MapService().links(coords.latitude, coords.longitude, label=formatted) if coords else {},
                validation=ValidationStatus(
                    format_valid=True,
                    postal_valid=True,
                    geographic_valid=True,
                    geocoded=bool(coords),
                    map_verified=bool(coords),
                ),
                source="curated_seed",
                landmark=matched_seed.get("notes"),
            )

        raise AppError(
            "PLACE_NOT_FOUND",
            f"No verified address found for '{clean_query}'. Please check the spelling or add a city name.",
            status_code=404,
        )
