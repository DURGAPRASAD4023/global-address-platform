"""Country address rules helpers."""

from app.countries.base.schemas import CountryRules, SupportLevel


def planned_rules(
    country_code: str,
    country_name: str,
    *,
    postal_code_regex: str | None = None,
    required_components: list[str] | None = None,
    administrative_levels: list[str] | None = None,
    default_locale: str = "en",
) -> CountryRules:
    return CountryRules(
        country_code=country_code.upper(),
        country_name=country_name,
        required_components=required_components
        or ["address_line_1", "city", "postal_code", "country"],
        postal_code_regex=postal_code_regex,
        administrative_levels=administrative_levels or [],
        default_locale=default_locale,
        support_level=SupportLevel.PLANNED,
    )
