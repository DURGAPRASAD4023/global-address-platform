"""Country catalog endpoints."""

from fastapi import APIRouter, Response

from app.countries.registry import CountryRegistry
from app.core.exceptions import AppError

router = APIRouter()


@router.get("")
async def list_countries(response: Response) -> dict[str, object]:
    response.headers["Cache-Control"] = "public, max-age=3600"
    countries = CountryRegistry.list_countries()
    return {
        "success": True,
        "data": {
            "count": len(countries),
            "countries": countries,
        },
    }


@router.get("/{country_code}")
async def get_country(country_code: str) -> dict[str, object]:
    adapter = CountryRegistry.get(country_code)
    rules = adapter.get_rules()
    return {
        "success": True,
        "data": {
            "country_code": rules.country_code,
            "country_name": rules.country_name,
            "support_level": rules.support_level.value,
            "required_components": rules.required_components,
            "optional_components": rules.optional_components,
            "postal_code_regex": rules.postal_code_regex,
            "administrative_levels": rules.administrative_levels,
            "default_locale": rules.default_locale,
            "notes": rules.notes,
        },
    }


@router.get("/{country_code}/rules")
async def get_country_rules(country_code: str) -> dict[str, object]:
    if len(country_code) != 2:
        raise AppError("INVALID_COUNTRY_CODE", "Country code must be ISO 3166-1 alpha-2.")
    return await get_country(country_code)
