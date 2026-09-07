from app.countries.base.adapter import CountryAddressAdapter
from app.countries.base.schemas import CountryRules, SupportLevel
from app.countries.planned import PlannedCountryAdapter


def test_planned_adapter_rules() -> None:
    adapter = PlannedCountryAdapter(
        "US",
        "United States",
        postal_code_regex=r"^\d{5}(-\d{4})?$",
        administrative_levels=["state"],
    )
    rules = adapter.get_rules()
    assert isinstance(adapter, CountryAddressAdapter)
    assert isinstance(rules, CountryRules)
    assert rules.support_level == SupportLevel.PLANNED
    assert rules.country_code == "US"
