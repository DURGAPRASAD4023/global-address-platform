import pytest
from app.services.validation_service import ValidationService

@pytest.mark.asyncio
async def test_validate_great_russell_street_no_none_prefix():
    service = ValidationService()
    raw = "Great Russell Street\nLondon, England, WC1B 3DG\nUnited Kingdom"
    result = await service.validate("GB", raw)

    assert result["parsed_address"]["address_line_1"] == "Great Russell Street"
    assert "None" not in result["parsed_address"]["address_line_1"]
    assert result["standardized_address"]["address_line_1"] == "Great Russell Street"
    assert "None" not in result["standardized_address"]["formatted_address"]

    # Seed match verification
    assert result["validation"]["format_valid"] is True
    assert result["validation"]["postal_valid"] is True
    assert result["validation"]["geographic_valid"] is True
    assert result["validation"]["geocoded"] is True
    assert result["validation"]["map_verified"] is True
    assert result["coordinates"] is not None
    assert result["coordinates"]["latitude"] == pytest.approx(51.5194, 0.001)
    assert "google_maps" in result["map_links"]


@pytest.mark.asyncio
async def test_validate_single_line_no_commas():
    service = ValidationService()
    raw = "10 Downing St London SW1A 2AA"
    result = await service.validate("GB", raw)

    assert result["parsed_address"]["address_line_1"] == "10 Downing St"
    assert result["parsed_address"]["city"] == "London"
    assert result["parsed_address"]["postal_code"] == "SW1A 2AA"
    assert result["validation"]["format_valid"] is True
    assert result["validation"]["postal_valid"] is True


@pytest.mark.asyncio
async def test_validate_flat_unit_prefix():
    service = ValidationService()
    raw = "Flat 4B, 10 Downing Street, London, SW1A 2AA"
    result = await service.validate("GB", raw)

    assert result["parsed_address"]["address_line_1"] == "10 Downing Street"
    assert result["parsed_address"]["address_line_2"] == "Flat 4B"
    assert result["parsed_address"]["city"] == "London"
    assert result["parsed_address"]["postal_code"] == "SW1A 2AA"
    assert result["validation"]["format_valid"] is True
    assert result["validation"]["postal_valid"] is True

