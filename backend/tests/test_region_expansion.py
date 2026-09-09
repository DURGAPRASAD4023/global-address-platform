"""Tests for full long detailed region/state expansion across markets."""

import pytest
from fastapi.testclient import TestClient

from app.countries.common.regions import expand_region
from app.countries.registry import CountryRegistry
from app.main import app
from app.services.generation_service import GenerationService
from app.services.validation_service import ValidationService

client = TestClient(app)


def test_expand_region_unit() -> None:
    # US
    assert expand_region("US", "CA") == "California"
    assert expand_region("US", "NY") == "New York"
    assert expand_region("US", "DC") == "District of Columbia"
    assert expand_region("US", "tx") == "Texas"
    assert expand_region("US", "US-FL") == "Florida"

    # Canada
    assert expand_region("CA", "ON") == "Ontario"
    assert expand_region("CA", "BC") == "British Columbia"
    assert expand_region("CA", "QC") == "Quebec"

    # Australia
    assert expand_region("AU", "NSW") == "New South Wales"
    assert expand_region("AU", "VIC") == "Victoria"
    assert expand_region("AU", "QLD") == "Queensland"

    # Germany
    assert expand_region("DE", "BY") == "Bavaria"
    assert expand_region("DE", "BW") == "Baden-Württemberg"
    assert expand_region("DE", "BE") == "Berlin"

    # Brazil
    assert expand_region("BR", "SP") == "São Paulo"
    assert expand_region("BR", "RJ") == "Rio de Janeiro"

    # India
    assert expand_region("IN", "DL") == "Delhi"
    assert expand_region("IN", "MH") == "Maharashtra"
    assert expand_region("IN", "TS") == "Telangana"
    assert expand_region("IN", "KA") == "Karnataka"

    # Mexico
    assert expand_region("MX", "CDMX") == "Ciudad de México"


@pytest.mark.asyncio
async def test_seed_generation_all_markets_have_long_regions() -> None:
    service = GenerationService()
    test_countries = ["US", "CA", "AU", "DE", "BR", "IN", "MX", "ES", "FR", "IT", "GB", "NL"]
    for cc in test_countries:
        result = await service.generate(cc, source="seed")
        assert result.country_code == cc
        if result.region:
            # Region must NOT be a 2 or 3 letter uppercase code
            assert len(result.region) > 3 or result.region in {"Rome", "Bern", "Oslo", "Lima", "Fès"}, (
                f"Country {cc} returned short region '{result.region}'"
            )
            assert result.region not in {"CA", "NY", "DC", "ON", "BC", "QC", "NSW", "VIC", "BY", "BW", "SP", "RJ", "DL", "MH"}


@pytest.mark.asyncio
async def test_validation_normalizes_short_state_to_long_state() -> None:
    service = ValidationService()
    # US raw address with "DC"
    raw_dc = "1600 Pennsylvania Avenue NW\nWashington, DC 20500\nUnited States"
    result = await service.validate("US", raw_dc)
    assert result["standardized_address"]["region"] == "District of Columbia"
    assert "District of Columbia" in result["standardized_address"]["formatted_address"]

    # US raw address with "NY"
    raw_ny = "350 5th Ave\nNew York, NY 10118\nUnited States"
    result_ny = await service.validate("US", raw_ny)
    assert result_ny["standardized_address"]["region"] == "New York"
