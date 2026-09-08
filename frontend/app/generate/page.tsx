"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useRef } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  ExternalLink,
  Globe2,
  Landmark,
  Loader2,
  Map,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { CountrySelect } from "@/components/common/CountrySelect";
import { StatusPipeline } from "@/components/generator/StatusPipeline";
import { api } from "@/lib/api";
import type { Country } from "@/types/address";

const PLACE_PRESETS = [
  { label: "🇮🇳 Taj Mahal, Agra", query: "Taj Mahal, Agra", country: "IN" },
  { label: "🇫🇷 Eiffel Tower, Paris", query: "Eiffel Tower, Paris", country: "FR" },
  { label: "🇮🇳 Charminar, Hyderabad", query: "Charminar, Hyderabad", country: "IN" },
  { label: "🇺🇸 White House, DC", query: "White House, Washington DC", country: "US" },
  { label: "🇬🇧 Big Ben, London", query: "Big Ben, London", country: "GB" },
  { label: "🇦🇪 Burj Khalifa, Dubai", query: "Burj Khalifa, Dubai", country: "AE" },
  { label: "🇦🇺 Sydney Opera House", query: "Sydney Opera House", country: "AU" },
];

export default function GeneratePage() {
  const [mode, setMode] = useState<"generate" | "search">("generate");
  const [country, setCountry] = useState("GB");
  const [source, setSource] = useState<"live" | "seed">("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [lastResult, setLastResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: api.listCountries,
  });

  const generate = useMutation({
    mutationFn: () => api.generateAddress(country, source),
    onSuccess: (data: any) => {
      setLastResult(data);
      const isLive = data?.source === "live_osm";
      toast.success(
        isLive
          ? "Live real-world address fetched from OpenStreetMap!"
          : "Curated seed address generated successfully!"
      );
    },
    onError: (err: Error) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const searchMutation = useMutation({
    mutationFn: () => api.searchPlace(searchQuery, searchCountry || undefined),
    onSuccess: (data: any) => {
      setLastResult(data);
      toast.success(`Found verified physical address for "${searchQuery}"!`);
    },
    onError: (err: Error) => {
      toast.error(`Search failed: ${err.message}`);
    },
  });

  const countries: Country[] = countriesQuery.data?.countries ?? [];

  // Active result from either generation or search
  const result = (generate.data ?? searchMutation.data ?? lastResult) as any;
  const coordinates = result?.coordinates;
  const isPending = generate.isPending || searchMutation.isPending;

  const mapHref = coordinates
    ? `/map?lat=${encodeURIComponent(coordinates.latitude)}&lon=${encodeURIComponent(coordinates.longitude)}&label=${encodeURIComponent(result.formatted_address ?? result.address_line_1)}`
    : "/map";

  const googleMapsUrl = coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`
    : null;

  function handleCopy(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  function handleReset() {
    setLastResult(null);
    generate.reset();
    searchMutation.reset();
  }

  function applyPlacePreset(preset: (typeof PLACE_PRESETS)[0]) {
    setSearchQuery(preset.query);
    setSearchCountry(preset.country);
    searchMutation.mutate();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      {/* Header Tag */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-teal-800">
          Global Address Hub
        </span>
        <span className="text-xs text-ink-400">• OpenStreetMap &amp; Curated Seeds</span>
      </div>

      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-950">
        Global Address Platform
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        Generate genuine international addresses with separated Address Line 1 and Line 2, or search any physical place worldwide.
      </p>

      {/* Mode Switcher Tabs */}
      <div className="mt-6 flex rounded-xl border border-ink-200 bg-ink-50/70 p-1">
        <button
          type="button"
          onClick={() => setMode("generate")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
            mode === "generate"
              ? "bg-white text-teal-900 shadow-xs ring-1 ring-ink-200/70"
              : "text-ink-600 hover:text-ink-950"
          }`}
        >
          <Sparkles className="h-4 w-4 text-teal-600" />
          Random Address Generator
        </button>
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
            mode === "search"
              ? "bg-white text-teal-900 shadow-xs ring-1 ring-ink-200/70"
              : "text-ink-600 hover:text-ink-950"
          }`}
        >
          <Search className="h-4 w-4 text-teal-600" />
          Global Place / Landmark Search
        </button>
      </div>

      <div className="panel mt-4 space-y-6">
        {mode === "generate" ? (
          <>
            {/* Source Selector Mode */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Address Source Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSource("live")}
                  className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                    source === "live"
                      ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20 shadow-xs"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe2
                      className={`h-4 w-4 ${source === "live" ? "text-teal-700" : "text-ink-500"}`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        source === "live" ? "text-teal-950" : "text-ink-800"
                      }`}
                    >
                      Live OpenStreetMap
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] text-ink-500 leading-tight">
                    Real-world shops, buildings &amp; streets fetched dynamically.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSource("seed")}
                  className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                    source === "seed"
                      ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20 shadow-xs"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Landmark
                      className={`h-4 w-4 ${source === "seed" ? "text-teal-700" : "text-ink-500"}`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        source === "seed" ? "text-teal-950" : "text-ink-800"
                      }`}
                    >
                      Curated Seeds
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] text-ink-500 leading-tight">
                    Curated public monuments, civic landmarks &amp; fast offline dataset.
                  </span>
                </button>
              </div>
            </div>

            {/* Target Country Selector */}
            <div>
              <label htmlFor="country" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Target Country
              </label>
              <CountrySelect
                id="country"
                value={country}
                onChange={setCountry}
                countries={countries}
                loading={countriesQuery.isLoading}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-primary"
                disabled={generate.isPending || !country}
                onClick={() => generate.mutate()}
              >
                {generate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : result ? (
                  "Generate Another"
                ) : (
                  "Generate Address"
                )}
              </button>

              {result && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReset}
                  title="Clear result"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </>
        ) : (
          /* Global Place Search Mode */
          <div className="space-y-4">
            <div>
              <label htmlFor="place-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Search Place, Monument or Landmark
              </label>
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-ink-400" />
                <input
                  id="place-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      searchMutation.mutate();
                    }
                  }}
                  placeholder="e.g. Taj Mahal, Eiffel Tower, Charminar, Times Square..."
                  className="field pl-10 pr-24 text-sm font-medium"
                />
                <button
                  type="button"
                  disabled={searchMutation.isPending || !searchQuery.trim()}
                  onClick={() => searchMutation.mutate()}
                  className="absolute right-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-teal-800 disabled:opacity-50"
                >
                  {searchMutation.isPending ? "Searching…" : "Search"}
                </button>
              </div>
            </div>

            {/* Quick Place Presets */}
            <div>
              <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-ink-600">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Popular Places (1-Click Search):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PLACE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPlacePreset(preset)}
                    className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isPending && <StatusPipeline />}

        {(generate.isError || searchMutation.isError) && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {((generate.error || searchMutation.error) as Error)?.message ||
              "Could not find or verify address for the specified request."}
          </div>
        )}

        {/* Address Result Display */}
        {result && (
          <section className="space-y-5 border-t border-ink-200 pt-6" aria-label="Generated address result">
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      result.source === "live_osm"
                        ? "bg-teal-100 text-teal-800 border border-teal-200"
                        : result.source === "global_place_search"
                        ? "bg-sky-100 text-sky-800 border border-sky-200"
                        : "bg-ink-100 text-ink-800 border border-ink-200"
                    }`}
                  >
                    {result.source === "live_osm" ? (
                      <>
                        <Globe2 className="h-3 w-3" />
                        Live OpenStreetMap
                      </>
                    ) : result.source === "global_place_search" ? (
                      <>
                        <Search className="h-3 w-3" />
                        Global Place Match
                      </>
                    ) : (
                      <>
                        <Landmark className="h-3 w-3" />
                        Curated Civic Landmark
                      </>
                    )}
                  </span>

                  {result.landmark && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                      🏷️ {result.landmark}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 font-display text-2xl font-bold text-ink-950">
                  {result.city ?? result.country}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Google Maps
                  </a>
                )}

                <Link href={mapHref} className="btn-secondary" title="Open in platform map">
                  <Map className="mr-1.5 h-3.5 w-3.5" />
                  View on map
                </Link>
              </div>
            </div>

            {/* Distinct Address Line 1 and Address Line 2 Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-teal-600" />
                    Address Line 1
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.address_line_1, "Line 1")}
                    className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 transition hover:bg-teal-100"
                  >
                    {copiedField === "Line 1" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedField === "Line 1" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1.5 font-mono text-sm font-bold text-ink-950">
                  {result.address_line_1 || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  <span className="flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-teal-600" />
                    Address Line 2 (Unit / Locality)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.address_line_2, "Line 2")}
                    className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 transition hover:bg-teal-100"
                  >
                    {copiedField === "Line 2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedField === "Line 2" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1.5 font-mono text-sm font-bold text-ink-950">
                  {result.address_line_2 || "—"}
                </p>
              </div>
            </div>

            {/* Complete Formatted Address Card */}
            <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                  <MapPin className="h-4 w-4 text-teal-700" />
                  Full Formatted Address
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(result.formatted_address, "Full Address")}
                  className="btn-secondary py-1 text-xs"
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {copiedField === "Full Address" ? "Copied" : "Copy All"}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed text-ink-950 font-mono">
                {result.formatted_address}
              </p>
            </div>

            {/* Component Summary Grid */}
            <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
              {[
                ["Country", result.country],
                ["City", result.city],
                ["Region / State", result.region],
                ["Postal Code", result.postal_code],
                ["Coordinates", coordinates ? `${coordinates.latitude}, ${coordinates.longitude}` : "Unavailable"],
                ["Map Verified", result.validation?.map_verified ? "✅ Verified" : "⚠️ Unverified"],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex items-center justify-between rounded-lg border border-ink-100 bg-white px-3 py-2">
                  <span className="font-semibold text-ink-500">{lbl}</span>
                  <span className="font-mono font-bold text-ink-900">{val || "—"}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
