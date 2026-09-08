"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  CircleAlert,
  Compass,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CountrySelect } from "@/components/common/CountrySelect";
import { api } from "@/lib/api";
import type { Country } from "@/types/address";

const PRESET_SAMPLES = [
  {
    country: "GB",
    label: "🇬🇧 British Museum (Multi-line)",
    address: "Great Russell Street\nLondon, England, WC1B 3DG\nUnited Kingdom",
  },
  {
    country: "GB",
    label: "🇬🇧 10 Downing St (Single-line)",
    address: "10 Downing St London SW1A 2AA",
  },
  {
    country: "US",
    label: "🇺🇸 White House (US Format)",
    address: "1600 Pennsylvania Avenue NW\nWashington, DC 20500\nUnited States",
  },
  {
    country: "DE",
    label: "🇩🇪 Pariser Platz (European)",
    address: "Pariser Platz 1, 10117 Berlin, Germany",
  },
  {
    country: "CA",
    label: "🇨🇦 CN Tower (Canada)",
    address: "290 Bremner Blvd\nToronto, ON M5V 3L9\nCanada",
  },
  {
    country: "IN",
    label: "🇮🇳 Rajpath, New Delhi (India)",
    address: "Rajpath, New Delhi 110001, India",
  },
];

export default function ValidatePage() {
  const [country, setCountry] = useState("GB");
  const [address, setAddress] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: api.listCountries,
  });

  const validate = useMutation({
    mutationFn: () => api.validateAddress(country, address),
    onSuccess: () => {
      toast.success("Address parsed and validated successfully!");
    },
    onError: (err: Error) => {
      toast.error(`Validation failed: ${err.message}`);
    },
  });

  const countries: Country[] = countriesQuery.data?.countries ?? [];

  function handleCopy(text: string, fieldName: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function applyPreset(sample: (typeof PRESET_SAMPLES)[0]) {
    setCountry(sample.country);
    setAddress(sample.address);
    toast.info(`Loaded sample: ${sample.label}`);
  }

  const result: any = validate.data;
  const data = result?.data ?? result;
  const parsed = data?.parsed_address ?? {};
  const normalized = data?.standardized_address ?? {};
  const validation = data?.validation ?? {};
  const coordinates = data?.coordinates ?? null;
  const mapLinks = data?.map_links ?? {};
  const googleMapsUrl =
    mapLinks.google_maps ||
    (coordinates
      ? `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`
      : null);

  const parsedEntries = Object.entries(parsed).filter(([key, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (key === "extras" && typeof value === "object" && Object.keys(value as object).length === 0) {
      return false;
    }
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Address Intelligence
            </span>
            <span className="text-xs text-ink-400">• ISO 19160 Compliant Rules</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-950">
            Global Address Validator
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            Paste any unformatted address text. The platform automatically splits components,
            validates postal regex, cross-checks geographic databases, and resolves map coordinates.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Left Column: Input Form */}
        <section className="space-y-5">
          <div className="panel space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <h2 className="text-base font-semibold text-ink-950">Input Address</h2>
              <button
                type="button"
                onClick={() => {
                  setAddress("");
                  validate.reset();
                }}
                className="text-xs text-ink-400 hover:text-ink-700"
              >
                Reset form
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Quick Samples (Try 1-Click):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SAMPLES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-900"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Selector */}
            <div>
              <label htmlFor="country" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Target Country
              </label>
              <CountrySelect
                id="country"
                value={country}
                onChange={setCountry}
                countries={countries}
                loading={countriesQuery.isLoading}
              />
              {countriesQuery.isError && (
                <div className="mt-2 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                  <span>Could not load countries ({countriesQuery.error?.message}).</span>
                  <button
                    type="button"
                    onClick={() => countriesQuery.refetch()}
                    className="ml-2 rounded bg-amber-200 px-2 py-0.5 font-semibold hover:bg-amber-300"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Address Textarea */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                  Address Text
                </label>
                <span className="text-[11px] text-ink-400">
                  {address.length} characters
                </span>
              </div>
              <textarea
                id="address"
                className="field min-h-36 font-mono text-sm leading-relaxed"
                placeholder="Paste any multi-line or single-line address..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              disabled={validate.isPending || !address.trim()}
              onClick={() => validate.mutate()}
            >
              {validate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating Address…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Validate Address
                </>
              )}
            </button>

            {validate.isError && (
              <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
                <CircleAlert className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Validation Error</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    {(validate.error as Error).message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick tips panel */}
          <div className="rounded-xl border border-ink-200/80 bg-white/70 p-4 text-xs text-ink-600 shadow-xs">
            <h3 className="font-semibold text-ink-900 flex items-center gap-1.5 mb-1.5">
              <Compass className="h-4 w-4 text-teal-600" />
              How Validation Works
            </h3>
            <ul className="space-y-1.5 list-disc pl-4 text-ink-500">
              <li><strong>Token Parser:</strong> Segregates building #, thoroughfare, city, administrative region, and postal code.</li>
              <li><strong>Postal Matcher:</strong> Verifies postal code against national regex rules.</li>
              <li><strong>Seed Verification:</strong> Cross-checks against curated public landmarks & verified coordinates.</li>
            </ul>
          </div>
        </section>

        {/* Right Column: Validation Results */}
        <section className="space-y-5">
          {!validate.data && !validate.isPending && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-white/50 p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-200/80">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
                No Address Validated Yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-ink-500">
                Select a country, enter an address or choose a 1-click sample on the left, then click
                <strong> Validate Address</strong>.
              </p>
            </div>
          )}

          {validate.isPending && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-200 bg-white p-12 text-center shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="mt-3 font-semibold text-ink-900">Validating & Geocoding…</p>
              <p className="text-xs text-ink-400">Parsing components and testing postal format</p>
            </div>
          )}

          {validate.isSuccess && (
            <>
              {/* Overall Status Banner */}
              <div
                className={`rounded-xl p-4 border flex flex-wrap items-center justify-between gap-3 shadow-xs ${
                  validation.format_valid && validation.geocoded
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                    : validation.format_valid
                    ? "border-teal-200 bg-teal-50/80 text-teal-950"
                    : "border-rose-200 bg-rose-50/80 text-rose-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  {validation.format_valid ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
                      <XCircle className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold">
                      {validation.format_valid && validation.geocoded
                        ? "Valid & Verified Address"
                        : validation.format_valid
                        ? "Format Valid Address"
                        : "Validation Concerns Found"}
                    </h3>
                    <p className="text-xs opacity-85">
                      {data?.message || "Address parsing and normalization completed."}
                    </p>
                  </div>
                </div>

                {coordinates && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300">
                      📍 {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Standardized Output Card */}
              <div className="panel border-teal-200/90 bg-gradient-to-br from-white via-white to-teal-50/30">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-teal-700" />
                    <h3 className="font-semibold text-ink-950">Standardized Formatted Address</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(normalized.formatted_address, "Formatted Address")
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:bg-ink-50 shadow-xs"
                    >
                      <Copy className="h-3.5 w-3.5 text-ink-500" />
                      {copiedField === "Formatted Address" ? "Copied" : "Copy"}
                    </button>

                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-800"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* Prominent Address Line 1 and Line 2 breakdown */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-teal-200 bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-teal-600" />
                        Address Line 1
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(normalized.address_line_1, "Address Line 1")}
                        className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 transition hover:bg-teal-100"
                      >
                        {copiedField === "Address Line 1" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedField === "Address Line 1" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-1 font-mono text-sm font-bold text-ink-950">
                      {normalized.address_line_1 || "—"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-teal-200 bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800">
                      <span className="flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-teal-600" />
                        Address Line 2 (Unit / Locality)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(normalized.address_line_2, "Address Line 2")}
                        className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 transition hover:bg-teal-100"
                      >
                        {copiedField === "Address Line 2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedField === "Address Line 2" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-1 font-mono text-sm font-bold text-ink-950">
                      {normalized.address_line_2 || "— (None)"}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    Full Standardized Output:
                  </div>
                  <pre className="overflow-auto rounded-lg bg-ink-950 p-4 font-mono text-xs leading-6 text-ink-50 shadow-inner">
                    {normalized.formatted_address}
                  </pre>
                </div>

                {data?.notes && (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-teal-50/70 px-3 py-1.5 text-xs text-teal-900 border border-teal-200/60">
                    <span className="font-bold">Verified Landmark:</span>
                    <span>{data.notes}</span>
                  </div>
                )}
              </div>

              {/* Two Column Details: Parsed Components + Validation Evidence */}
              <div className="grid gap-5 md:grid-cols-2">
                {/* Parsed Components */}
                <div className="panel">
                  <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
                    <h3 className="font-semibold text-ink-950">Parsed Components</h3>
                    <span className="text-xs text-ink-400">
                      {parsedEntries.length} items identified
                    </span>
                  </div>

                  <dl className="mt-3 divide-y divide-ink-100 text-sm">
                    {parsedEntries.map(([key, value]) => {
                      const displayValue =
                        typeof value === "object" ? JSON.stringify(value) : String(value);
                      return (
                        <div key={key} className="flex items-center justify-between gap-3 py-2">
                          <dt className="text-xs capitalize text-ink-500">
                            {key.replaceAll("_", " ")}
                          </dt>
                          <dd className="flex items-center gap-2 text-right text-xs font-semibold text-ink-900 font-mono">
                            <span>{displayValue}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(displayValue, key)}
                              title={`Copy ${key}`}
                              className="text-ink-400 hover:text-ink-700"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>

                {/* Validation Evidence Matrix */}
                <div className="panel">
                  <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
                    <h3 className="font-semibold text-ink-950">Validation Signals</h3>
                    <span className="text-xs text-ink-400">Rules & Authority</span>
                  </div>

                  <dl className="mt-3 divide-y divide-ink-100 text-sm">
                    {Object.entries(validation).map(([key, value]) => {
                      const isPass = value === true;
                      const isFail = value === false;
                      return (
                        <div key={key} className="flex items-center justify-between py-2">
                          <dt className="flex items-center gap-1 text-xs capitalize text-ink-600">
                            {key.replaceAll("_", " ")}
                            {key === "deliverability_verified" && (
                              <span
                                title="Deliverability requires mailbox registry authority (USPS DPV / Royal Mail PAF) confirming mail receptacle existence."
                                className="cursor-help text-ink-400 hover:text-ink-600"
                              >
                                <HelpCircle className="h-3 w-3" />
                              </span>
                            )}
                          </dt>
                          <dd>
                            {isPass ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Pass
                              </span>
                            ) : isFail ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                {key === "deliverability_verified" ? "Unverified" : "Fail"}
                              </span>
                            ) : (
                              <span className="text-xs text-ink-400">Unknown</span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>

                  <div className="mt-4 rounded-md border border-amber-200/80 bg-amber-50/70 p-3 text-[11px] text-amber-900 leading-relaxed">
                    <p className="font-semibold flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 text-amber-700" />
                      About Deliverability vs. Geocoding
                    </p>
                    <p className="mt-1 text-amber-800">
                      Geocoded & Map Verified confirms the physical road, building, and coordinates exist.
                      Deliverability requires live carrier postal delivery verification (DPV/PAF).
                    </p>
                  </div>
                </div>
              </div>

              {/* Developer JSON Inspector Toggle */}
              <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowJson(!showJson)}
                    className="text-xs font-semibold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                  >
                    {showJson ? "Hide Raw API Payload" : "View Raw API Response (JSON)"}
                  </button>

                  {showJson && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(JSON.stringify(data, null, 2), "Raw JSON")
                      }
                      className="inline-flex items-center gap-1 rounded border border-ink-200 px-2 py-0.5 text-xs text-ink-600 hover:bg-ink-50"
                    >
                      <Copy className="h-3 w-3" />
                      Copy JSON
                    </button>
                  )}
                </div>

                {showJson && (
                  <pre className="mt-3 overflow-x-auto rounded-md bg-ink-950 p-4 font-mono text-xs text-ink-50 max-h-72">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
