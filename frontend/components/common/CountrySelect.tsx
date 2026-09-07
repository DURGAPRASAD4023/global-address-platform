"use client";

import type { Country } from "@/types/address";

type Props = {
  id?: string;
  value: string;
  onChange: (code: string) => void;
  countries: Country[];
  loading?: boolean;
};

export function CountrySelect({ id, value, onChange, countries, loading }: Props) {
  return (
    <select
      id={id}
      className="field"
      value={value}
      disabled={loading}
      onChange={(e) => onChange(e.target.value)}
      aria-busy={loading}
    >
      {loading && <option value="">Loading countries…</option>}
      {!loading && countries.length === 0 && (
        <option value="">No countries loaded (check backend)</option>
      )}
      {!loading &&
        countries.map((c) => (
          <option key={c.country_code} value={c.country_code}>
            {c.country_name} ({c.country_code})
          </option>
        ))}
    </select>
  );
}
