"""Base country address adapter — all countries implement this interface.

Adding a country must not require modifying core services.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from app.countries.base.schemas import (
    AddressComponents,
    CountryRules,
    GeneratedAddress,
    ValidationStatus,
)


class CountryAddressAdapter(ABC):
    """Country-specific parse / validate / normalize / format / generate."""

    country_code: str
    country_name: str

    @abstractmethod
    def get_rules(self) -> CountryRules:
        """Return country-specific address rules and metadata."""

    @abstractmethod
    def parse(self, raw_address: str) -> AddressComponents:
        """Extract components from raw multi-line / free-form text."""

    @abstractmethod
    def validate(self, address: AddressComponents) -> ValidationStatus:
        """Validate format, postal, and geographic consistency (no geocoding)."""

    @abstractmethod
    def normalize(self, address: AddressComponents) -> AddressComponents:
        """Normalize casing, abbreviations, and component ordering."""

    @abstractmethod
    def format(self, address: AddressComponents) -> str:
        """Produce a country-appropriate formatted address string."""

    @abstractmethod
    async def generate(self) -> GeneratedAddress:
        """Generate a candidate address for this country.

        Implementations should construct candidates from geographic/postal
        datasets. The generation *service* is responsible for geocoding retries
        and discarding unverified candidates.
        """

    def support_level(self) -> str:
        return self.get_rules().support_level.value
