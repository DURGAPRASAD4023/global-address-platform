"""Shared address component schemas for country adapters."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SupportLevel(StrEnum):
    PLANNED = "planned"
    PARTIAL = "partial"
    FULL = "full"


class ValidationStatus(BaseModel):
    """Distinct verification statuses — never conflate geocoded with deliverable."""

    format_valid: bool | None = None
    postal_valid: bool | None = None
    geographic_valid: bool | None = None
    geocoded: bool | None = None
    map_verified: bool | None = None
    deliverability_verified: bool | None = False

    model_config = ConfigDict(extra="forbid")


class Coordinates(BaseModel):
    latitude: float
    longitude: float


class AddressComponents(BaseModel):
    country: str | None = None
    country_code: str | None = None
    address_line_1: str | None = None
    address_line_2: str | None = None
    house_number: str | None = None
    street: str | None = None
    unit: str | None = None
    locality: str | None = None
    city: str | None = None
    region: str | None = None
    postal_code: str | None = None
    formatted_address: str | None = None
    landmark: str | None = None
    extras: dict[str, Any] = Field(default_factory=dict)


class CountryRules(BaseModel):
    country_code: str
    country_name: str
    required_components: list[str]
    optional_components: list[str] = Field(default_factory=list)
    postal_code_regex: str | None = None
    administrative_levels: list[str] = Field(default_factory=list)
    default_locale: str = "en"
    address_format_template: str = "{address_line_1}\n{city}\n{postal_code}\n{country}"
    support_level: SupportLevel = SupportLevel.PLANNED
    notes: str | None = None


class GeneratedAddress(BaseModel):
    country: str
    country_code: str
    address_line_1: str
    address_line_2: str | None = None
    city: str | None = None
    region: str | None = None
    postal_code: str | None = None
    formatted_address: str
    coordinates: Coordinates | None = None
    geocoding_provider: str | None = None
    geocoding_status: str | None = None
    map_verification_status: str | None = None
    map_links: dict[str, str] = Field(default_factory=dict)
    validation: ValidationStatus
    source: str | None = None
    landmark: str | None = None
