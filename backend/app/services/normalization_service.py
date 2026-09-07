"""Normalization service."""

from typing import Any

from app.countries.registry import CountryRegistry


class NormalizationService:
    def normalize(self, country_code: str, raw_address: str) -> dict[str, Any]:
        adapter = CountryRegistry.get(country_code)
        parsed = adapter.parse(raw_address.strip())
        normalized = adapter.normalize(parsed)
        return {
            "original_address": raw_address,
            "normalized_address": normalized.model_dump(),
            "formatted_address": adapter.format(normalized),
        }
