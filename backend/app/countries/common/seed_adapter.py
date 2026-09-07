"""Shared helpers for country adapters — parsing, postal checks, seed-backed generation."""

from __future__ import annotations

import random
import re
import unicodedata
from typing import Any

from app.countries.base.adapter import CountryAddressAdapter
from app.countries.base.schemas import (
    AddressComponents,
    Coordinates,
    CountryRules,
    GeneratedAddress,
    SupportLevel,
    ValidationStatus,
)
from app.core.exceptions import AppError
from app.data.loader import get_country_seeds
from app.services.map_service import MapService


STREET_ALIASES: dict[str, str] = {
    "st": "Street",
    "st.": "Street",
    "rd": "Road",
    "rd.": "Road",
    "ave": "Avenue",
    "ave.": "Avenue",
    "av": "Avenue",
    "blvd": "Boulevard",
    "blvd.": "Boulevard",
    "ln": "Lane",
    "dr": "Drive",
    "dr.": "Drive",
    "ct": "Court",
    "hwy": "Highway",
    "pkwy": "Parkway",
    "sq": "Square",
}


def expand_street_token(token: str) -> str:
    key = token.lower().rstrip(".")
    return STREET_ALIASES.get(key, token)


def title_preserve_postal(text: str) -> str:
    parts = []
    for word in text.split():
        if re.fullmatch(r"[A-Z0-9]{2,}", word) and any(c.isdigit() for c in word):
            parts.append(word.upper())
        else:
            parts.append(word[:1].upper() + word[1:].lower() if word else word)
    return " ".join(parts)


def normalize_whitespace(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def postal_matches(postal: str | None, pattern: str | None) -> bool | None:
    if not pattern:
        return None
    if not postal:
        return False
    return re.match(pattern, postal.strip(), flags=re.IGNORECASE) is not None


class SeedBackedAdapter(CountryAddressAdapter):
    """Adapter backed by curated public seed locations + country rules.

    Generation produces candidates from the geographic seed dataset.
    Live geocoding / map verification is orchestrated by GenerationService.
    """

    def __init__(self, rules: CountryRules) -> None:
        self._rules = rules
        self.country_code = rules.country_code.upper()
        self.country_name = rules.country_name

    def get_rules(self) -> CountryRules:
        return self._rules

    def _seeds(self) -> list[dict[str, Any]]:
        seeds = get_country_seeds(self.country_code)
        if not seeds:
            raise AppError(
                "SEED_DATA_MISSING",
                f"No seed locations configured for {self.country_code}.",
                status_code=503,
            )
        return seeds

    def parse(self, raw_address: str) -> AddressComponents:
        raw = normalize_whitespace(raw_address)
        if not raw:
            raise AppError("EMPTY_ADDRESS", "Address text is empty.", status_code=422)

        lines = [ln.strip(" ,") for ln in raw.replace(",", "\n").split("\n") if ln.strip()]
        # Also support single-line comma separated already split above
        if len(lines) == 1 and "," in raw_address:
            lines = [p.strip() for p in raw_address.split(",") if p.strip()]

        postal: str | None = None
        region: str | None = None
        city: str | None = None
        house_number: str | None = None
        street: str | None = None
        unit: str | None = None

        pattern = self._rules.postal_code_regex
        remaining: list[str] = []
        for line in lines:
            if pattern and postal is None:
                m = re.search(pattern, line, flags=re.IGNORECASE)
                if m:
                    postal = m.group(0).upper() if self.country_code in {"CA", "GB"} else m.group(0)
                    line = (line[: m.start()] + line[m.end() :]).strip(" ,")
            remaining.append(line) if line else None

        remaining = [r for r in remaining if r]

        # Drop trailing country name if present
        if remaining and remaining[-1].lower() in {
            self.country_name.lower(),
            self.country_code.lower(),
        }:
            remaining = remaining[:-1]

        if remaining:
            first = remaining[0]
            hm = re.match(r"^(\d+[A-Za-z]?)\s+(.+)$", first)
            if hm:
                house_number = hm.group(1)
                street = hm.group(2)
            else:
                um = re.match(r"^(apt|apartment|unit|suite|flat)\s+(.+)$", first, re.I)
                if um:
                    unit = first
                else:
                    street = first

        if len(remaining) >= 2:
            city = remaining[-1] if not region else remaining[-2]
            # Heuristic: penultimate may be city; last may be region+postal already stripped
            if len(remaining) >= 3:
                city = remaining[-2]
                region = remaining[-1]
            elif len(remaining) == 2:
                city = remaining[1]

        # Country-specific tweaks via hook
        components = AddressComponents(
            country=self.country_name,
            country_code=self.country_code,
            address_line_1=(
                f"{house_number} {street}".strip()
                if (house_number and street)
                else (street or (remaining[0] if remaining else None))
            ),
            address_line_2=unit,
            house_number=house_number,
            street=street,
            unit=unit,
            city=city,
            region=region,
            postal_code=postal,
        )
        return self._post_parse(raw, lines, components)

    def _post_parse(
        self,
        raw: str,
        lines: list[str],
        components: AddressComponents,
    ) -> AddressComponents:
        return components

    def validate(self, address: AddressComponents) -> ValidationStatus:
        required = set(self._rules.required_components)
        missing: list[str] = []
        field_map = {
            "address_line_1": address.address_line_1,
            "city": address.city,
            "postal_code": address.postal_code,
            "region": address.region,
            "country": address.country or address.country_code,
        }
        for key in required:
            if key == "country":
                continue
            if not field_map.get(key):
                missing.append(key)

        format_valid = len(missing) == 0
        postal_valid = postal_matches(address.postal_code, self._rules.postal_code_regex)
        if "postal_code" not in required and not address.postal_code:
            postal_valid = None if not self._rules.postal_code_regex else postal_valid

        geographic_valid = None
        if address.city and address.postal_code:
            # Soft check: seed corpus contains matching city+postal pair
            geographic_valid = any(
                (s.get("city") or "").lower() == address.city.lower()
                and (s.get("postal_code") or "") == (address.postal_code or "")
                for s in get_country_seeds(self.country_code)
            )
            if geographic_valid is False:
                # Unknown pair is not necessarily invalid — leave as None (unknown)
                geographic_valid = None

        return ValidationStatus(
            format_valid=format_valid,
            postal_valid=postal_valid,
            geographic_valid=geographic_valid,
            geocoded=False,
            map_verified=False,
            deliverability_verified=False,
        )

    def normalize(self, address: AddressComponents) -> AddressComponents:
        street = address.street
        if street:
            tokens = [expand_street_token(t) for t in street.split()]
            street = " ".join(tokens)
            street = title_preserve_postal(street)

        line1 = address.address_line_1
        if address.house_number and street:
            line1 = f"{address.house_number} {street}"
        elif street:
            line1 = street
        elif line1:
            if line1.startswith("None "):
                line1 = line1[5:]
            # Expand aliases inside line1
            parts = line1.split()
            parts = [expand_street_token(p) if i > 0 else p for i, p in enumerate(parts)]
            line1 = title_preserve_postal(" ".join(parts))

        postal = address.postal_code
        if postal and self.country_code == "CA":
            p = re.sub(r"\s+", "", postal.upper())
            postal = f"{p[:3]} {p[3:]}" if len(p) == 6 else postal.upper()
        elif postal and self.country_code == "GB":
            postal = re.sub(r"\s+", " ", postal.upper()).strip()

        city = title_preserve_postal(address.city) if address.city else None
        region = address.region.upper() if address.region and len(address.region) <= 3 else (
            title_preserve_postal(address.region) if address.region else None
        )

        normalized = AddressComponents(
            country=self.country_name,
            country_code=self.country_code,
            address_line_1=line1,
            address_line_2=address.address_line_2,
            house_number=address.house_number,
            street=street,
            unit=address.unit,
            locality=address.locality,
            city=city,
            region=region,
            postal_code=postal,
            landmark=address.landmark,
            extras=address.extras,
        )
        normalized.formatted_address = self.format(normalized)
        return normalized

    def format(self, address: AddressComponents) -> str:
        lines: list[str] = []
        if address.address_line_1:
            lines.append(address.address_line_1)
        if address.address_line_2:
            lines.append(address.address_line_2)

        city_line_parts = [p for p in [address.city, address.region, address.postal_code] if p]
        # Country-specific ordering hooks
        city_line = self._format_locality_line(address)
        if city_line:
            lines.append(city_line)
        elif city_line_parts:
            lines.append(", ".join(city_line_parts))

        lines.append(self.country_name)
        return "\n".join(lines)

    def _format_locality_line(self, address: AddressComponents) -> str | None:
        return None

    async def generate(self) -> GeneratedAddress:
        seed = random.choice(self._seeds())
        components = AddressComponents(
            country=self.country_name,
            country_code=self.country_code,
            address_line_1=seed.get("address_line_1"),
            address_line_2=seed.get("address_line_2"),
            city=seed.get("city"),
            region=seed.get("region"),
            postal_code=seed.get("postal_code") or None,
        )
        normalized = self.normalize(components)
        validation = self.validate(normalized)
        coords = None
        if seed.get("latitude") is not None and seed.get("longitude") is not None:
            coords = Coordinates(latitude=float(seed["latitude"]), longitude=float(seed["longitude"]))

        return GeneratedAddress(
            country=self.country_name,
            country_code=self.country_code,
            address_line_1=normalized.address_line_1 or "",
            address_line_2=normalized.address_line_2,
            city=normalized.city,
            region=normalized.region,
            postal_code=normalized.postal_code,
            formatted_address=normalized.formatted_address or self.format(normalized),
            coordinates=coords,
            geocoding_provider="curated_seed",
            geocoding_status="verified",
            map_verification_status="verified",
            map_links=MapService().links(
                coords.latitude, coords.longitude, label=normalized.formatted_address
            ) if coords else {},
            validation=ValidationStatus(
                format_valid=validation.format_valid,
                postal_valid=validation.postal_valid,
                geographic_valid=True if coords else validation.geographic_valid,
                geocoded=bool(coords),
                map_verified=bool(coords),
                deliverability_verified=False,
            ),
        )


def build_rules(
    country_code: str,
    country_name: str,
    *,
    postal_code_regex: str | None,
    required_components: list[str],
    administrative_levels: list[str],
    default_locale: str,
    support_level: SupportLevel = SupportLevel.PARTIAL,
    address_format_template: str = "",
    notes: str | None = None,
) -> CountryRules:
    return CountryRules(
        country_code=country_code.upper(),
        country_name=country_name,
        required_components=required_components,
        postal_code_regex=postal_code_regex,
        administrative_levels=administrative_levels,
        default_locale=default_locale,
        support_level=support_level,
        address_format_template=address_format_template
        or "{address_line_1}\n{city}\n{postal_code}\n{country}",
        notes=notes,
    )


def attach_map_links(address: GeneratedAddress) -> GeneratedAddress:
    if address.coordinates:
        address.map_links = MapService().links(
            address.coordinates.latitude,
            address.coordinates.longitude,
            label=address.formatted_address,
        )
    return address
