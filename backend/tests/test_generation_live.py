import pytest
from app.services.generation_service import GenerationService

@pytest.mark.asyncio
async def test_generate_seed_source():
    service = GenerationService()
    result = await service.generate("GB", source="seed")
    assert result.country_code == "GB"
    assert result.source == "curated_seed"
    assert result.formatted_address is not None
    assert result.coordinates is not None
    assert result.validation.geocoded is True

@pytest.mark.asyncio
async def test_generate_live_source():
    service = GenerationService()
    result = await service.generate("GB", source="live")
    assert result.country_code == "GB"
    assert result.source in {"live_osm", "curated_seed"}
    assert result.formatted_address is not None
    assert result.coordinates is not None
