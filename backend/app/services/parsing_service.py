"""Parsing service — delegates to country adapters."""

from app.countries.base.schemas import AddressComponents
from app.countries.registry import CountryRegistry


class ParsingService:
    def parse(self, country_code: str, raw_address: str) -> AddressComponents:
        adapter = CountryRegistry.get(country_code)
        return adapter.parse(raw_address.strip())
