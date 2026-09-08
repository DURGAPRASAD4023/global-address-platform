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
  ShieldCheck,
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
    label: "🇬🇧 British Museum",
    address: "Great Russell Street\nLondon, England, WC1B 3DG\nUnited Kingdom",
  },
  {
    country: "GB",
    label: "🇬🇧 10 Downing St",
    address: "10 Downing St London SW1A 2AA",
  },
  {
    country: "US",
    label: "🇺🇸 White House",
    address: "1600 Pennsylvania Avenue NW\nWashington, DC 20500\nUnited States",
  },
  {
    country: "DE",
    label: "🇩🇪 Pariser Platz",
    address: "Pariser Platz 1, 10117 Berlin, Germany",
  },
  {
    country: "CA",
    label: "🇨🇦 CN Tower",
    address: "290 Bremner Blvd\nToronto, ON M5V 3L9\nCanada",
  },
  {
    country: "IN",
    label: "🇮🇳 Rajpath, Delhi",
    address: "Rajpath, New Delhi 110001, India",
  },
];

export default function ValidatePage() {
  const [country, setCountry] = useState("GB");
  const [address, setAddress] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: api.listCountries,
  });

  const validate = useMutation({
    mutationFn: () => api.validateAddress(country, address),
    onSuccess: () => {
      toast.success("Address validated successfully!");
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
    toast.success(`${fieldName} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function applyPreset(sample: (typeof PRESET_SAMPLES)[0]) {
    setCountry(sample.country);
    setAddress(sample.address);
    toast.info(`Loaded: ${sample.label}`);
  }

  const result: any = validate.data;
  const data = result?.data ?? result;
  const normalized = data?.standardized_address ?? {};
  const validation = data?.validation ?? {};
  const coordinates = data?.coordinates ?? null;
  const mapLinks = data?.map_links ?? {};
  const googleMapsUrl =
    mapLinks.google_maps ||
    (coordinates
      ? `https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`
      : null);

  const isValid = validation.format_valid;
  const isGeocoded = validation.geocoded;

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-800">
          <ShieldCheck className="h-3.5 w-3.5" />
          Address Validator
        </span>
        <span className="text-xs text-ink-400">• ISO 19160 Standards</span>
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-950">
        Validate an Address
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        Paste any address — we will check its format, postal code, and geographic accuracy.
        Get the standardized output with Address Line 1 &amp; 2 ready to use.
      </p>

      {/* Input Card */}
      <div className="panel mt-8 space-y-5">
        <div className="flex items-center justify-between border-b border-ink-100 pb-3">
          <h2 className="text-base font-semibold text-ink-950">Enter Address</h2>
          <button
            type="button"
            onClick={() => {
              setAddress("");
              validate.reset();
            }}
            className="text-xs text-ink-400 hover:text-ink-700"
          >
            Clear
          </button>
        </div>

        {/* Quick Samples */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Sample Addresses:
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

        {/* Country */}
        <div>
          <label htmlFor="country" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
            Country
          </label>
          <CountrySelect
            id="country"
            value={country}
            onChange={setCountry}
            countries={countries}
            loading={countriesQuery.isLoading}
          />
        </div>

        {/* Address Textarea */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-ink-700">
              Address Text
            </label>
            <span className="text-[11px] text-ink-400">{address.length} characters</span>
          </div>
          <textarea
            id="address"
            className="field min-h-28 font-mono text-sm leading-relaxed"
            placeholder="Paste any multi-line or single-line address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          disabled={validate.isPending || !address.trim()}
          onClick={() => validate.mutate()}
        >
          {validate.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Validate Address
            </>
          )}
        </button>

        {validate.isError && (
          <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
            <CircleAlert className="h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Validation Error</p>
              <p className="text-xs text-red-700 mt-0.5">{(validate.error as Error).message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {validate.isPending && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-ink-200 bg-white p-10 text-center shadow-xs">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-3 font-semibold text-ink-900">Checking address…</p>
          <p className="text-xs text-ink-400">Validating format, postal code & geocoding</p>
        </div>
      )}

      {/* Empty state */}
      {!validate.data && !validate.isPending && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-white/50 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
            <MapPin className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
            Ready to Validate
          </h3>
          <p className="mt-1 max-w-sm text-xs text-ink-500">
            Choose a sample above or enter any address, then click <strong>Validate Address</strong>.
          </p>
        </div>
      )}

      {/* Results */}
      {validate.isSuccess && (
        <div className="mt-6 space-y-5">
          {/* Status Banner */}
          <div
            className={`rounded-2xl p-5 border flex flex-wrap items-center justify-between gap-4 shadow-xs ${
              isValid && isGeocoded
                ? "border-emerald-200 bg-emerald-50/80"
                : isValid
                ? "border-teal-200 bg-teal-50/80"
                : "border-rose-200 bg-rose-50/80"
            }`}
          >
            <div className="flex items-center gap-4">
              {isValid ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
                  <XCircle className="h-6 w-6" />
                </div>
              )}
              <div>
                <h3 className={`text-xl font-bold ${isValid ? "text-emerald-950" : "text-rose-950"}`}>
                  {isValid && isGeocoded
                    ? "✅ Valid & Verified Address"
                    : isValid
                    ? "✓ Format Valid"
                    : "⚠️ Validation Issues Found"}
                </h3>
                <p className={`text-sm mt-0.5 ${isValid ? "text-emerald-800" : "text-rose-800"}`}>
                  {data?.message || "Address parsing completed."}
                </p>
              </div>
            </div>

            {coordinates && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="rounded-md bg-white/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-300">
                  📍 {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </span>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-800"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Google Maps
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Address Line 1 + Line 2 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-teal-600" />
                  Address Line 1
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(normalized.address_line_1, "Line 1")}
                  className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 transition hover:bg-teal-100"
                >
                  {copiedField === "Line 1" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedField === "Line 1" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1.5 font-mono text-sm font-bold text-ink-950">
                {normalized.address_line_1 || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800">
                <span className="flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-teal-600" />
                  Address Line 2
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(normalized.address_line_2, "Line 2")}
                  className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 transition hover:bg-teal-100"
                >
                  {copiedField === "Line 2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedField === "Line 2" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1.5 font-mono text-sm font-bold text-ink-950">
                {normalized.address_line_2 || "— (None)"}
              </p>
            </div>
          </div>

          {/* Full Formatted Address */}
          <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-teal-100 pb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                <MapPin className="h-4 w-4 text-teal-700" />
                Full Standardized Address
              </span>
              <button
                type="button"
                onClick={() => handleCopy(normalized.formatted_address, "Full Address")}
                className="btn-secondary py-1 text-xs"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {copiedField === "Full Address" ? "Copied" : "Copy All"}
              </button>
            </div>
            <pre className="mt-3 whitespace-pre-line font-mono text-sm font-medium leading-relaxed text-ink-950">
              {normalized.formatted_address}
            </pre>
          </div>

          {/* Validation Signals */}
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
                          title="Deliverability requires mailbox registry authority (USPS DPV / Royal Mail PAF)."
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
                Geocoded vs Deliverability
              </p>
              <p className="mt-1 text-amber-800">
                Geocoded confirms the physical coordinates exist. Deliverability requires live carrier postal verification (USPS DPV / Royal Mail PAF).
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
