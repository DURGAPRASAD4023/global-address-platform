"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
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
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CountrySelect } from "@/components/common/CountrySelect";
import { StatusPipeline } from "@/components/generator/StatusPipeline";
import { api } from "@/lib/api";
import type { Country } from "@/types/address";

// ---------- Photon OSM Types ----------
interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
    district?: string;
    locality?: string;
    type?: string;
    osm_type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

const US_STATE_EXPANSIONS: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

const CA_PROV_EXPANSIONS: Record<string, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick",
  NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories",
  NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", QC: "Quebec",
  SK: "Saskatchewan", YT: "Yukon",
};

const AU_STATE_EXPANSIONS: Record<string, string> = {
  ACT: "Australian Capital Territory", NSW: "New South Wales", NT: "Northern Territory",
  QLD: "Queensland", SA: "South Australia", TAS: "Tasmania", VIC: "Victoria", WA: "Western Australia",
};

function expandClientRegion(region: string, countryCode: string): string {
  if (!region) return "";
  const upper = region.trim().toUpperCase();
  const cc = countryCode.trim().toUpperCase();
  if (cc === "US" && US_STATE_EXPANSIONS[upper]) return US_STATE_EXPANSIONS[upper];
  if (cc === "CA" && CA_PROV_EXPANSIONS[upper]) return CA_PROV_EXPANSIONS[upper];
  if (cc === "AU" && AU_STATE_EXPANSIONS[upper]) return AU_STATE_EXPANSIONS[upper];
  if (US_STATE_EXPANSIONS[upper]) return US_STATE_EXPANSIONS[upper];
  return region;
}

// Build a clean address from Photon feature
function buildAddressFromPhoton(f: PhotonFeature): {
  address_line_1: string;
  address_line_2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  country_code: string;
  formatted_address: string;
  coordinates: { latitude: number; longitude: number };
  source: string;
  landmark: string;
} {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;

  const houseNum = p.housenumber ?? "";
  const street = p.street ?? "";
  const name = p.name ?? "";

  // Address Line 1: building name / house number + street
  let line1 = "";
  if (name && name !== street) {
    line1 = houseNum ? `${name}, ${houseNum} ${street}`.trim() : name;
  } else if (houseNum && street) {
    line1 = `${houseNum} ${street}`;
  } else if (street) {
    line1 = street;
  } else if (name) {
    line1 = name;
  }

  // Address Line 2: locality / district
  const line2 = p.district ?? p.locality ?? "";

  const city = p.city ?? p.locality ?? p.district ?? "";
  const countryCode = (p.country_code ?? "").toUpperCase();
  const rawRegion = p.state ?? "";
  const region = expandClientRegion(rawRegion, countryCode);
  const postal = p.postcode ?? "";
  const country = p.country ?? "";

  // Full formatted address
  const parts = [line1, line2, city, region, postal, country].filter(Boolean);
  const formatted = parts.join(", ");

  return {
    address_line_1: line1,
    address_line_2: line2,
    city,
    region,
    postal_code: postal,
    country,
    country_code: countryCode,
    formatted_address: formatted,
    coordinates: { latitude: lat, longitude: lon },
    source: "photon_osm",
    landmark: name !== street ? name : "",
  };
}

// Format suggestion label
function suggestionLabel(f: PhotonFeature): string {
  const p = f.properties;
  const parts: string[] = [];
  if (p.name) parts.push(p.name);
  if (p.street && p.name !== p.street) parts.push(p.street);
  if (p.city) parts.push(p.city);
  if (p.country) parts.push(p.country);
  return parts.join(", ");
}

const PLACE_PRESETS = [
  { label: "🕌 Taj Mahal", query: "Taj Mahal, Agra" },
  { label: "🗼 Eiffel Tower", query: "Eiffel Tower, Paris" },
  { label: "🕌 Charminar", query: "Charminar, Hyderabad" },
  { label: "🏛️ White House", query: "White House, Washington DC" },
  { label: "🕰️ Big Ben", query: "Big Ben, London" },
  { label: "🏗️ Burj Khalifa", query: "Burj Khalifa, Dubai" },
  { label: "🎭 Sydney Opera", query: "Sydney Opera House" },
];

export default function GeneratePage() {
  const [mode, setMode] = useState<"generate" | "search">("generate");
  const [country, setCountry] = useState("GB");
  const [source, setSource] = useState<"live" | "seed">("live");

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [searchCountry, setSearchCountry] = useState("");

  const [lastResult, setLastResult] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const countries: Country[] = countriesQuery.data?.countries ?? [];

  // Active result
  const result = (generate.data ?? selectedResult ?? lastResult) as any;
  const coordinates = result?.coordinates;
  const isPending = generate.isPending;

  const mapHref = coordinates
    ? `/map?lat=${encodeURIComponent(coordinates.latitude)}&lon=${encodeURIComponent(coordinates.longitude)}&label=${encodeURIComponent(result.formatted_address ?? result.address_line_1)}`
    : "/map";

  const googleMapsUrl = coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`
    : null;

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Photon search
  function handleSearchInput(val: string) {
    setSearchQuery(val);
    setShowSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: val, limit: "6", lang: "en" });
        if (searchCountry) params.set("location_bias_scale", "0.2");
        const res = await fetch(`https://photon.komoot.io/api/?${params}`);
        const json: PhotonResponse = await res.json();
        setSuggestions(json.features ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 350);
  }

  function handleSelectSuggestion(feature: PhotonFeature) {
    const addr = buildAddressFromPhoton(feature);
    setSelectedResult(addr);
    setLastResult(addr);
    setSearchQuery(suggestionLabel(feature));
    setShowSuggestions(false);
    setSuggestions([]);
    toast.success(`Address found: ${addr.city || addr.country}`);
  }

  function handlePresetSearch(query: string) {
    setSearchQuery(query);
    setShowSuggestions(false);
    setSuggestionsLoading(true);
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`)
      .then((r) => r.json())
      .then((json: PhotonResponse) => {
        if (json.features?.[0]) {
          handleSelectSuggestion(json.features[0]);
        } else {
          toast.error("Place not found. Try a different search.");
        }
      })
      .catch(() => toast.error("Search failed. Check your connection."))
      .finally(() => setSuggestionsLoading(false));
  }

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
    setSelectedResult(null);
    generate.reset();
    setSearchQuery("");
    setSuggestions([]);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-teal-800">
          Global Address Hub
        </span>
        <span className="text-xs text-ink-400">• OpenStreetMap & Curated Seeds</span>
      </div>

      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-950">
        Global Address Platform
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        Generate real international addresses or search any place worldwide — fully structured with Address Line 1 & 2.
      </p>

      {/* Mode Switcher */}
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
          Global Place Search
        </button>
      </div>

      <div className="panel mt-4 space-y-6">
        {mode === "generate" ? (
          <>
            {/* Source Selector */}
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
                    <Globe2 className={`h-4 w-4 ${source === "live" ? "text-teal-700" : "text-ink-500"}`} />
                    <span className={`text-sm font-semibold ${source === "live" ? "text-teal-950" : "text-ink-800"}`}>
                      Live OpenStreetMap
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] text-ink-500 leading-tight">
                    Real-world shops, buildings & streets fetched dynamically.
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
                    <Landmark className={`h-4 w-4 ${source === "seed" ? "text-teal-700" : "text-ink-500"}`} />
                    <span className={`text-sm font-semibold ${source === "seed" ? "text-teal-950" : "text-ink-800"}`}>
                      Curated Seeds
                    </span>
                  </div>
                  <span className="mt-1 text-[11px] text-ink-500 leading-tight">
                    Curated public monuments, civic landmarks & fast offline dataset.
                  </span>
                </button>
              </div>
            </div>

            {/* Country Selector */}
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
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </button>
              )}
            </div>
          </>
        ) : (
          /* Global Place Search Mode with Photon Autocomplete */
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Search Any Place, Landmark or Address
              </label>

              {/* Autocomplete Input */}
              <div ref={searchRef} className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-ink-400 pointer-events-none" />
                  <input
                    id="place-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Type any place: Taj Mahal, Eiffel Tower, Times Square…"
                    className="field pl-10 pr-10 text-sm font-medium"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSuggestions([]);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 text-ink-400 hover:text-ink-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && (searchQuery.length >= 2) && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
                    {suggestionsLoading ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-xs text-ink-500">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                        Searching OpenStreetMap…
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-ink-400">
                        No places found. Try a different query.
                      </div>
                    ) : (
                      <ul>
                        {suggestions.map((feature, i) => {
                          const p = feature.properties;
                          const label = suggestionLabel(feature);
                          return (
                            <li key={i}>
                              <button
                                type="button"
                                onClick={() => handleSelectSuggestion(feature)}
                                className="flex w-full items-start gap-3 px-4 py-3 text-left text-xs transition hover:bg-teal-50 border-b border-ink-100 last:border-0"
                              >
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                                <div className="min-w-0">
                                  <div className="font-semibold text-ink-900 truncate">
                                    {p.name || p.street || label}
                                  </div>
                                  <div className="text-ink-400 truncate mt-0.5">
                                    {[p.street, p.city, p.state, p.country]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </div>
                                </div>
                                {p.country_code && (
                                  <span className="ml-auto shrink-0 text-[10px] font-bold text-ink-400 uppercase">
                                    {p.country_code}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-1.5 text-[10px] text-ink-400">
                      Powered by{" "}
                      <a
                        href="https://photon.komoot.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-teal-700 hover:underline"
                      >
                        Photon / OpenStreetMap
                      </a>{" "}
                      — Free & Open Source
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-1.5 text-[11px] text-ink-400">
                Real-time suggestions from OpenStreetMap — 100% free, no API key needed.
              </p>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-ink-600">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Popular Landmarks (1-Click):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PLACE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={suggestionsLoading}
                    onClick={() => handlePresetSearch(preset.query)}
                    className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-900 disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {suggestionsLoading && !showSuggestions && (
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                Fetching address…
              </div>
            )}

            {result && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={handleReset}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Clear Result
              </button>
            )}
          </div>
        )}

        {isPending && <StatusPipeline />}

        {generate.isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {(generate.error as Error)?.message || "Could not generate address."}
          </div>
        )}

        {/* Address Result Display */}
        {result && (
          <section className="space-y-5 border-t border-ink-200 pt-6" aria-label="Address result">
            {/* Source badge + city */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      result.source === "live_osm"
                        ? "bg-teal-100 text-teal-800 border border-teal-200"
                        : result.source === "photon_osm"
                        ? "bg-sky-100 text-sky-800 border border-sky-200"
                        : "bg-ink-100 text-ink-800 border border-ink-200"
                    }`}
                  >
                    {result.source === "live_osm" ? (
                      <><Globe2 className="h-3 w-3" />Live OpenStreetMap</>
                    ) : result.source === "photon_osm" ? (
                      <><Search className="h-3 w-3" />Photon OSM Search</>
                    ) : (
                      <><Landmark className="h-3 w-3" />Curated Landmark</>
                    )}
                  </span>

                  {result.landmark && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                      🏷️ {result.landmark}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 font-display text-2xl font-bold text-ink-950">
                  {result.city || result.country}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Google Maps
                  </a>
                )}
                <Link href={mapHref} className="btn-secondary">
                  <Map className="mr-1.5 h-3.5 w-3.5" />
                  View on map
                </Link>
              </div>
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
                    Address Line 2
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

            {/* Full Formatted Address */}
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

            {/* Component Grid */}
            <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
              {[
                ["Country", result.country],
                ["City", result.city],
                ["Region / State", result.region],
                ["Postal Code", result.postal_code],
                ["Coordinates", coordinates ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}` : "Unavailable"],
                ["Map Verified", result.validation?.map_verified ? "✅ Verified" : result.source === "photon_osm" ? "✅ OSM Verified" : "⚠️ Unverified"],
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
