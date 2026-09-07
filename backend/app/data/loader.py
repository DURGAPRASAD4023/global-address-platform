"""Load curated seed addresses."""
from __future__ import annotations
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

_SEED_PATH = Path(__file__).with_name("seed_addresses.json")


@lru_cache
def load_seed_file() -> dict[str, Any]:
    with _SEED_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def get_country_seeds(country_code: str) -> list[dict[str, Any]]:
    data = load_seed_file()
    country = data.get("countries", {}).get(country_code.upper(), {})
    return list(country.get("locations", []))
