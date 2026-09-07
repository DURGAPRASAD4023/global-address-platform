"""Planned-country stub adapter — registered but not yet fully supported."""

from __future__ import annotations

from app.countries.base.adapter import CountryAddressAdapter
from app.countries.base.rules import planned_rules
from app.countries.base.schemas import (
    AddressComponents,
    CountryRules,
    GeneratedAddress,
    ValidationStatus,
)
from app.core.exceptions import AppError


class PlannedCountryAdapter(CountryAddressAdapter):
    """Placeholder until a full country adapter is implemented and tested."""

    def __init__(
        self,
        country_code: str,
        country_name: str,
        *,
        postal_code_regex: str | None = None,
        required_components: list[str] | None = None,
        administrative_levels: list[str] | None = None,
        default_locale: str = "en",
    ) -> None:
        self.country_code = country_code.upper()
        self.country_name = country_name
        self._rules = planned_rules(
            self.country_code,
            country_name,
            postal_code_regex=postal_code_regex,
            required_components=required_components,
            administrative_levels=administrative_levels,
            default_locale=default_locale,
        )

    def get_rules(self) -> CountryRules:
        return self._rules

    def parse(self, raw_address: str) -> AddressComponents:
        raise AppError(
            "COUNTRY_NOT_IMPLEMENTED",
            f"Parsing for {self.country_code} is not implemented yet.",
            status_code=501,
        )

    def validate(self, address: AddressComponents) -> ValidationStatus:
        raise AppError(
            "COUNTRY_NOT_IMPLEMENTED",
            f"Validation for {self.country_code} is not implemented yet.",
            status_code=501,
        )

    def normalize(self, address: AddressComponents) -> AddressComponents:
        raise AppError(
            "COUNTRY_NOT_IMPLEMENTED",
            f"Normalization for {self.country_code} is not implemented yet.",
            status_code=501,
        )

    def format(self, address: AddressComponents) -> str:
        raise AppError(
            "COUNTRY_NOT_IMPLEMENTED",
            f"Formatting for {self.country_code} is not implemented yet.",
            status_code=501,
        )

    async def generate(self) -> GeneratedAddress:
        raise AppError(
            "COUNTRY_NOT_IMPLEMENTED",
            f"Generation for {self.country_code} is not implemented yet.",
            status_code=501,
        )
