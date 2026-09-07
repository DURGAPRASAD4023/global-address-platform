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
