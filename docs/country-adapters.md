# Country adapters

## Interface

```python
class CountryAddressAdapter:
    def parse(self, raw_address): ...
    def validate(self, address): ...
    def normalize(self, address): ...
    def format(self, address): ...
    def generate(self): ...
    def get_rules(self): ...
```

## Layout

```text
backend/app/countries/
  base/          # abstract adapter + shared schemas
  planned.py     # stub for markets not yet implemented
  registry.py    # CountryRegistry
  us/ gb/ ca/ br/ in/   # Phase 3 targets
```

## Adding a country

1. Create package under `countries/<iso2>/`.
2. Implement adapter modules (parser, validator, formatter, rules).
3. Register via `CountryRegistry.register` (prefer auto-discovery over editing services).
4. Add dataset license metadata in `data-pipeline/configs/`.
5. Pass the country test matrix before marking `support_level=full`.

## Do not

- Scatter `if country == "US"` through services.
- Mark a country fully supported without tests.
- Invent address components when data is missing.
