"""Country registry — discover adapters without if/elif country chains."""

from __future__ import annotations

from app.countries.base.adapter import CountryAddressAdapter
from app.countries.base.schemas import SupportLevel
from app.countries.common.seed_adapter import SeedBackedAdapter, build_rules
from app.core.exceptions import AppError

# Initial 60 markets (ISO 3166-1 alpha-2). Full adapters land in later phases.
# Phase 3: US, GB, CA, BR, IN — currently registered as planned stubs.
_MARKET_CATALOG: list[tuple[str, str, dict[str, object]]] = [
    # North America
    ("US", "United States", {"postal_code_regex": r"^\d{5}(-\d{4})?$", "administrative_levels": ["state"], "default_locale": "en"}),
    ("CA", "Canada", {"postal_code_regex": r"^[A-Z]\d[A-Z]\s?\d[A-Z]\d$", "administrative_levels": ["province"], "default_locale": "en"}),
    ("MX", "Mexico", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["state"], "default_locale": "es"}),
    # Europe
    ("GB", "United Kingdom", {"postal_code_regex": r"^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$", "administrative_levels": [], "default_locale": "en"}),
    ("DE", "Germany", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["state"], "default_locale": "de"}),
    ("FR", "France", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["department"], "default_locale": "fr"}),
    ("IT", "Italy", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["region", "province"], "default_locale": "it"}),
    ("ES", "Spain", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["autonomous_community", "province"], "default_locale": "es"}),
    ("NL", "Netherlands", {"postal_code_regex": r"^\d{4}\s?[A-Z]{2}$", "administrative_levels": ["province"], "default_locale": "nl"}),
    ("BE", "Belgium", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["region", "province"], "default_locale": "nl"}),
    ("CH", "Switzerland", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["canton"], "default_locale": "de"}),
    ("AT", "Austria", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["state"], "default_locale": "de"}),
    ("SE", "Sweden", {"postal_code_regex": r"^\d{3}\s?\d{2}$", "administrative_levels": ["county"], "default_locale": "sv"}),
    ("NO", "Norway", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["county"], "default_locale": "nb"}),
    ("DK", "Denmark", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["region"], "default_locale": "da"}),
    ("FI", "Finland", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["region"], "default_locale": "fi"}),
    ("IE", "Ireland", {"postal_code_regex": r"^[A-Z]\d{2}\s?[A-Z0-9]{4}$", "administrative_levels": ["county"], "default_locale": "en"}),
    ("PL", "Poland", {"postal_code_regex": r"^\d{2}-\d{3}$", "administrative_levels": ["voivodeship"], "default_locale": "pl"}),
    ("PT", "Portugal", {"postal_code_regex": r"^\d{4}-\d{3}$", "administrative_levels": ["district"], "default_locale": "pt"}),
    ("CZ", "Czechia", {"postal_code_regex": r"^\d{3}\s?\d{2}$", "administrative_levels": ["region"], "default_locale": "cs"}),
    ("GR", "Greece", {"postal_code_regex": r"^\d{3}\s?\d{2}$", "administrative_levels": ["region"], "default_locale": "el"}),
    ("HU", "Hungary", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["county"], "default_locale": "hu"}),
    ("RO", "Romania", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["county"], "default_locale": "ro"}),
    ("UA", "Ukraine", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["oblast"], "default_locale": "uk"}),
    ("LU", "Luxembourg", {"postal_code_regex": r"^\d{4}$", "administrative_levels": [], "default_locale": "fr"}),
    ("SK", "Slovakia", {"postal_code_regex": r"^\d{3}\s?\d{2}$", "administrative_levels": ["region"], "default_locale": "sk"}),
    ("RU", "Russia", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["federal_subject"], "default_locale": "ru"}),
    # Asia-Pacific
    ("CN", "China", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["province", "city"], "default_locale": "zh"}),
    ("JP", "Japan", {"postal_code_regex": r"^\d{3}-?\d{4}$", "administrative_levels": ["prefecture"], "default_locale": "ja"}),
    ("KR", "South Korea", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["province"], "default_locale": "ko"}),
    ("IN", "India", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["state", "district"], "default_locale": "en"}),
    ("AU", "Australia", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["state"], "default_locale": "en"}),
    ("NZ", "New Zealand", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["region"], "default_locale": "en"}),
    ("SG", "Singapore", {"postal_code_regex": r"^\d{6}$", "administrative_levels": [], "default_locale": "en"}),
    ("ID", "Indonesia", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["province"], "default_locale": "id"}),
    ("MY", "Malaysia", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["state"], "default_locale": "ms"}),
    ("TH", "Thailand", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["province"], "default_locale": "th"}),
    ("VN", "Vietnam", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["province"], "default_locale": "vi"}),
    ("PH", "Philippines", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["province"], "default_locale": "en"}),
    ("TW", "Taiwan", {"postal_code_regex": r"^\d{3}(\d{2})?$", "administrative_levels": ["city_county"], "default_locale": "zh"}),
    ("HK", "Hong Kong", {"postal_code_regex": None, "administrative_levels": ["district"], "default_locale": "zh"}),
    ("PK", "Pakistan", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["province"], "default_locale": "en"}),
    ("BD", "Bangladesh", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["division"], "default_locale": "bn"}),
    ("KZ", "Kazakhstan", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["region"], "default_locale": "kk"}),
    # Middle East
    ("AE", "United Arab Emirates", {"postal_code_regex": None, "administrative_levels": ["emirate"], "default_locale": "ar"}),
    ("SA", "Saudi Arabia", {"postal_code_regex": r"^\d{5}(-\d{4})?$", "administrative_levels": ["region"], "default_locale": "ar"}),
    ("IL", "Israel", {"postal_code_regex": r"^\d{7}$", "administrative_levels": ["district"], "default_locale": "he"}),
    ("TR", "Türkiye", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["province"], "default_locale": "tr"}),
    ("QA", "Qatar", {"postal_code_regex": None, "administrative_levels": ["municipality"], "default_locale": "ar"}),
    # Latin America
    ("BR", "Brazil", {"postal_code_regex": r"^\d{5}-?\d{3}$", "administrative_levels": ["state"], "default_locale": "pt"}),
    ("AR", "Argentina", {"postal_code_regex": r"^[A-Z]?\d{4}[A-Z]{0,3}$", "administrative_levels": ["province"], "default_locale": "es"}),
    ("CL", "Chile", {"postal_code_regex": r"^\d{7}$", "administrative_levels": ["region"], "default_locale": "es"}),
    ("CO", "Colombia", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["department"], "default_locale": "es"}),
    ("PE", "Peru", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["department"], "default_locale": "es"}),
    ("UY", "Uruguay", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["department"], "default_locale": "es"}),
    # Africa
    ("ZA", "South Africa", {"postal_code_regex": r"^\d{4}$", "administrative_levels": ["province"], "default_locale": "en"}),
    ("EG", "Egypt", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["governorate"], "default_locale": "ar"}),
    ("NG", "Nigeria", {"postal_code_regex": r"^\d{6}$", "administrative_levels": ["state"], "default_locale": "en"}),
    ("KE", "Kenya", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["county"], "default_locale": "en"}),
    ("MA", "Morocco", {"postal_code_regex": r"^\d{5}$", "administrative_levels": ["region"], "default_locale": "ar"}),
]


class CountryRegistry:
    """Singleton-style registry of country adapters."""

    _adapters: dict[str, CountryAddressAdapter] = {}
    _loaded: bool = False
    _countries_cache: list[dict[str, str]] | None = None

    @classmethod
    def load(cls) -> None:
        if cls._loaded:
            return
        cls._adapters.clear()
        cls._countries_cache = None
        for code, name, meta in _MARKET_CATALOG:
            postal_pattern = meta.get("postal_code_regex")
            required = ["address_line_1", "city", "country"]
            if postal_pattern:
                required.append("postal_code")
            rules = build_rules(
                code,
                name,
                postal_code_regex=postal_pattern,  # type: ignore[arg-type]
                required_components=required,
                administrative_levels=meta.get("administrative_levels"),  # type: ignore[arg-type]
                default_locale=str(meta.get("default_locale", "en")),
                support_level=SupportLevel.PLANNED,
                notes="Seed-backed parser and generator; live geocoding remains provider-configurable.",
            )
            adapter = SeedBackedAdapter(rules)
            cls.register(adapter)
        cls._loaded = True

    @classmethod
    def register(cls, adapter: CountryAddressAdapter) -> None:
        cls._adapters[adapter.country_code.upper()] = adapter
        cls._countries_cache = None

    @classmethod
    def get(cls, country_code: str) -> CountryAddressAdapter:
        if not cls._loaded:
            cls.load()
        code = country_code.upper()
        adapter = cls._adapters.get(code)
        if adapter is None:
            raise AppError(
                "COUNTRY_NOT_SUPPORTED",
                f"Country '{code}' is not in the supported market catalog.",
                status_code=404,
                details={"country_code": code},
            )
        return adapter

    @classmethod
    def list_countries(cls) -> list[dict[str, str]]:
        if not cls._loaded:
            cls.load()
        if cls._countries_cache is not None:
            return cls._countries_cache
        items: list[dict[str, str]] = []
        for code, adapter in sorted(cls._adapters.items()):
            rules = adapter.get_rules()
            items.append(
                {
                    "country_code": code,
                    "country_name": adapter.country_name,
                    "support_level": rules.support_level.value,
                    "default_locale": rules.default_locale,
                }
            )
        cls._countries_cache = items
        return items

    @classmethod
    def count(cls) -> int:
        if not cls._loaded:
            cls.load()
        return len(cls._adapters)
