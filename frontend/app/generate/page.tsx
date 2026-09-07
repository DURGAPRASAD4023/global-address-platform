"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useRef } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe2,
  Landmark,
  Map,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CountrySelect } from "@/components/common/CountrySelect";
import { StatusPipeline } from "@/components/generator/StatusPipeline";
import { api } from "@/lib/api";
import type { Country } from "@/types/address";

// Deliverability tooltip explanation
const DELIVERABILITY_TOOLTIP =
  "Deliverability means an authoritative postal body (Royal Mail, USPS, India Post, etc.) has confirmed this address can receive mail. This requires official postal datasets that are not yet integrated. Geocoded ≠ Deliverable.";

export default function GeneratePage() {
  const [country, setCountry] = useState("GB");
  const [source, setSource] = useState<"live" | "seed">("live");
  // Persist the last generated result even when user navigates away and back
  const [lastResult, setLastResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Use the latest mutation result, fall back to lastResult if we navigated away
  const result = (generate.data ?? lastResult) as any;
  const coordinates = result?.coordinates;
  const validation = result?.validation ?? {};

  const mapHref = coordinates
    ? `/map?lat=${encodeURIComponent(coordinates.latitude)}&lon=${encodeURIComponent(coordinates.longitude)}&label=${encodeURIComponent(result.formatted_address ?? result.address_line_1)}`
    : "/map";

  const googleMapsUrl = coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`
    : null;

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result.formatted_address ?? "").then(() => {
      setCopied(true);
      toast.success("Address copied to clipboard!");
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
      tooltipTimeout.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    setLastResult(null);
    generate.reset();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-teal-800">
          Dynamic Generation
        </span>
        <span className="text-xs text-ink-400">
          <span className="mx-1 text-ink-300">•</span>
          OpenStreetMap &amp; Curated Seeds
        </span>
      </div>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-950">
        Global Address Generator
      </h1>
      <p className="mt-2 text-sm text-ink-600">
        Generate genuine international addresses. Choose between live dynamic sourcing from
        OpenStreetMap or verified civic seed landmarks.
      </p>

      <div className="panel mt-8 space-y-6">
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
                  className={`h-4 w-4 ${
                    source === "live" ? "text-teal-700" : "text-ink-500"
                  }`}
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
                Real-world physical shops, buildings, and streets fetched dynamically.
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
                  className={`h-4 w-4 ${
                    source === "seed" ? "text-teal-700" : "text-ink-500"
                  }`}
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
          {countriesQuery.isError && (
            <div className="mt-2 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
              <span>Could not load countries. Make sure FastAPI backend is running on port 8000.</span>
              <button
                type="button"
                onClick={() => countriesQuery.refetch()}
                className="ml-3 shrink-0 rounded bg-amber-200 px-2 py-1 font-semibold hover:bg-amber-300"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            disabled={generate.isPending || !country}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? "Generating…" : result ? "Generate Another" : "Generate Address"}
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

        {generate.isPending && <StatusPipeline />}

        {generate.isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {(generate.error as Error).message ||
              "Address could not be verified with sufficient confidence."}
          </div>
        )}

        {result && (
          <section className="space-y-5 border-t border-ink-200 pt-6" aria-label="Generated address result">
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      result.source === "live_osm"
                        ? "bg-teal-100 text-teal-800 border border-teal-200"
                        : "bg-ink-100 text-ink-800 border border-ink-200"
                    }`}
                  >
                    {result.source === "live_osm" ? (
                      <>
                        <Globe2 className="h-3 w-3" />
                        Live OpenStreetMap
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
                {/* Copy button */}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopy}
                  title="Copy formatted address"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>

                {/* Google Maps button */}
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Google Maps
                  </a>
                )}

                {/* Platform Map button */}
                <Link href={mapHref} className="btn-secondary" title="Open in platform map">
                  <Map className="mr-2 h-4 w-4" />
                  View on map
                </Link>
              </div>
            </div>

            {/* Formatted address card */}
            <div className="rounded-lg border border-teal-200/80 bg-teal-50/30 p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-ink-950">
                  {result.formatted_address}
                </p>
              </div>
            </div>

            {/* Component grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Country", result.country],
                ["Address line", result.address_line_1],
                ["City", result.city],
                ["Region", result.region],
                ["Postal code", result.postal_code],
                ["Coordinates", coordinates ? `${coordinates.latitude}, ${coordinates.longitude}` : "Unavailable"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-ink-200 bg-white/80 px-4 py-3 shadow-xs">
                  <p className="text-xs uppercase tracking-wider text-ink-400">{label}</p>
                  <p className="mt-1 text-sm font-medium text-ink-900">{value ?? "Not provided"}</p>
                </div>
              ))}
            </div>

            {/* Verification statuses */}
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-700" />
                <h3 className="font-semibold text-ink-950">Verification status</h3>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  { label: "Format", value: validation.format_valid },
                  { label: "Postal code", value: validation.postal_valid },
                  { label: "Geographic match", value: validation.geographic_valid },
                  { label: "Geocoded", value: validation.geocoded },
                  { label: "Map verified", value: validation.map_verified },
                  { label: "Deliverability", value: validation.deliverability_verified, hasTooltip: true },
                ].map(({ label, value, hasTooltip }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-md border border-ink-200 bg-white px-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-1 text-ink-600">
                      {label}
                      {hasTooltip && (
                        <span
                          title={DELIVERABILITY_TOOLTIP}
                          className="cursor-help text-xs text-ink-400 hover:text-ink-700"
                        >
                          ⓘ
                        </span>
                      )}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        value === true
                          ? "text-emerald-700"
                          : hasTooltip && value === false
                          ? "text-amber-600"
                          : "text-ink-400"
                      }`}
                    >
                      {value === true ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Pass
                        </>
                      ) : hasTooltip && value === false ? (
                        <>
                          <XCircle className="h-4 w-4 text-amber-500" />
                          Unverified
                        </>
                      ) : (
                        "Fail"
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Explanatory note */}
              <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                <p>
                  <strong>Why is Deliverability unverified?</strong> Geocoded &amp; Map verified
                  means the physical coordinates and location exist on real global maps. Deliverability
                  requires an authoritative carrier dataset (like USPS DPV or Royal Mail PAF) to confirm
                  an active postal delivery point.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
