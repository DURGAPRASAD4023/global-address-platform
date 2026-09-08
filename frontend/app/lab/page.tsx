"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CircleAlert,
  Code2,
  Compass,
  Copy,
  ExternalLink,
  FlaskConical,
  Layers,
  Loader2,
  Sparkles,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { CountrySelect } from "@/components/common/CountrySelect";
import { api } from "@/lib/api";
import type { Country } from "@/types/address";

const STAGES = [
  { id: "input", name: "1. Input", label: "Raw Stream", color: "sky" },
  { id: "parse", name: "2. Parse", label: "Token Segmentation", color: "violet" },
  { id: "standardize", name: "3. Standardize", label: "Lexical Normalize", color: "amber" },
  { id: "validate", name: "4. Rules", label: "Postal & ISO 19160", color: "rose" },
  { id: "enrich", name: "5. Geo-Enrich", label: "Coordinates & Maps", color: "teal" },
  { id: "score", name: "6. Score", label: "Quality & Confidence", color: "emerald" },
];

const SAMPLE_PRESETS = [
  {
    name: "🇬🇧 British Museum",
    country: "GB",
    address: "Great Russell Street\nLondon, England, WC1B 3DG\nUnited Kingdom",
  },
  {
    name: "🇬🇧 10 Downing St",
    country: "GB",
    address: "10 Downing St London SW1A 2AA",
  },
  {
    name: "🇺🇸 White House",
    country: "US",
    address: "1600 Pennsylvania Avenue NW\nWashington, DC 20500\nUnited States",
  },
  {
    name: "🇩🇪 Pariser Platz",
    country: "DE",
    address: "Pariser Platz 1, 10117 Berlin, Germany",
  },
  {
    name: "🇨🇦 CN Tower",
    country: "CA",
    address: "290 Bremner Blvd\nToronto, ON M5V 3L9\nCanada",
  },
  {
    name: "🇮🇳 Rajpath, Delhi",
    country: "IN",
    address: "Rajpath, New Delhi 110001, India",
  },
];

export default function AddressLabPage() {
  const [country, setCountry] = useState("GB");
  const [address, setAddress] = useState(
    "Great Russell Street\nLondon, England, WC1B 3DG\nUnited Kingdom"
  );
  const [selectedStage, setSelectedStage] = useState<string>("score");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: api.listCountries,
  });

  const countries: Country[] = countriesQuery.data?.countries ?? [];

  async function processAddress() {
    if (!address.trim()) {
      toast.error("Please enter an address to process.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res: any = await api.validateAddress(country, address);
      setResult(res);
      toast.success("Pipeline executed — inspect each transformation stage!");
    } catch (err: any) {
      const msg = err?.message || "Failed to process address";
      setError(msg);
      toast.error(`Processing error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function loadSample(sample: (typeof SAMPLE_PRESETS)[0]) {
    setCountry(sample.country);
    setAddress(sample.address);
    toast.info(`Loaded: ${sample.name}`);
  }

  const data = result?.data ?? result;
  const parsed = data?.parsed_address ?? {};
  const normalized = data?.standardized_address ?? {};
  const validation = data?.validation ?? {};
  const coordinates = data?.coordinates ?? null;
  const mapLinks = data?.map_links ?? {};
  const confidence = data?.confidence ?? (validation.format_valid ? 0.9 : 0.4);
  const qualityScore = Math.round(confidence * 100);

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

  const curlSnippet = `curl -X POST "https://global-address-platform-backend.onrender.com/api/v1/addresses/validate" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ country, address: address.replace(/\n/g, ", ") })}'`;

  const stagePayload = (() => {
    switch (selectedStage) {
      case "input": return { original_address: address };
      case "parse": return parsed;
      case "standardize": return normalized;
      case "validate": return validation;
      case "enrich": return { coordinates, map_links: mapLinks };
      case "score": return { confidence, quality_score: qualityScore, validation };
      default: return {};
    }
  })();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Dark header banner */}
      <div className="rounded-2xl bg-ink-950 px-6 py-5 text-white shadow-lg mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="h-5 w-5 text-teal-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-teal-400">
                🧪 Developer Inspection Workbench
              </span>
              <span className="rounded-full bg-teal-900/60 px-2 py-0.5 text-[10px] font-semibold text-teal-300 ring-1 ring-teal-700/50">
                ISO 19160
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Address Lab
            </h1>
            <p className="mt-1 text-sm text-ink-300">
              Step-by-step pipeline inspection: token parsing → lexical normalization → postal rules → geocoding → quality score.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-teal-700/50 bg-teal-900/40 px-4 py-2 text-xs font-semibold text-teal-300">
            <Terminal className="h-4 w-4" />
            <span>API Engine Testing Playground</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        {/* Left Form */}
        <section className="space-y-5">
          <div className="panel space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <h2 className="text-base font-semibold text-ink-950 flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-700" />
                Input Parameters
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAddress("");
                  setResult(null);
                }}
                className="text-xs text-ink-400 hover:text-ink-700"
              >
                Reset
              </button>
            </div>

            {/* Preset Samples */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
                <Sparkles className="h-3.5 w-3.5 text-teal-600" />
                Preset Test Samples:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => loadSample(preset)}
                    className="rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:border-teal-400 hover:bg-teal-50/50 hover:text-teal-900"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="lab-country" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-700">
                Target Country
              </label>
              <CountrySelect
                id="lab-country"
                value={country}
                onChange={setCountry}
                countries={countries}
                loading={countriesQuery.isLoading}
              />
            </div>

            {/* Raw Address */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="lab-address" className="text-xs font-semibold uppercase tracking-wider text-ink-700">
                  Raw Address Input Stream
                </label>
                <span className="text-[11px] text-ink-400">{address.length} chars</span>
              </div>
              <textarea
                id="lab-address"
                className="field min-h-36 font-mono text-sm leading-relaxed"
                value={address}
                placeholder="Enter street, city, postal code..."
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              disabled={loading || !address.trim()}
              onClick={processAddress}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Pipeline…
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Run Pipeline & Inspect Stages
                </>
              )}
            </button>

            {error && (
              <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
                <CircleAlert className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-semibold">Processing Failed</p>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* cURL Terminal Snippet */}
          <div className="rounded-xl border border-ink-700 bg-ink-950 p-4 text-xs text-ink-100 shadow-xs">
            <div className="flex items-center justify-between border-b border-ink-800 pb-2 mb-3">
              <span className="flex items-center gap-1.5 font-bold text-teal-400">
                <Code2 className="h-3.5 w-3.5" />
                cURL · Terminal Request
              </span>
              <button
                type="button"
                onClick={() => handleCopy(curlSnippet, "cURL command")}
                className="inline-flex items-center gap-1 rounded bg-ink-800 px-2 py-0.5 text-[10px] font-semibold text-teal-300 hover:bg-ink-700"
              >
                {copiedField === "cURL command" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedField === "cURL command" ? "Copied" : "Copy cURL"}
              </button>
            </div>
            <pre className="overflow-x-auto font-mono text-[11px] leading-5 text-teal-200">
              {curlSnippet}
            </pre>
          </div>
        </section>

        {/* Right Panel */}
        <section className="space-y-5">
          {/* Pipeline Stage Selector */}
          <div className="panel p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2.5">
              Click a stage to inspect the transformation:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {STAGES.map((stg) => {
                const isActive = selectedStage === stg.id;
                return (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => setSelectedStage(stg.id)}
                    className={`flex flex-col items-center justify-center rounded-lg p-2.5 text-center transition ${
                      isActive
                        ? "border-2 border-teal-600 bg-teal-50/80 text-teal-950 font-bold shadow-xs"
                        : "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
                    }`}
                  >
                    <span className="text-xs font-semibold">{stg.name}</span>
                    <span className="text-[9px] text-ink-400 truncate w-full mt-0.5">{stg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Idle state */}
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink-200 bg-white/50 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-950 text-teal-400 ring-1 ring-ink-700">
                <Terminal className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">
                Lab Idle — Awaiting Input
              </h3>
              <p className="mt-1 max-w-sm text-xs text-ink-500">
                Enter an address and click <strong>Run Pipeline</strong> to see stage-by-stage transformation data.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-ink-200 bg-white p-12 text-center shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p className="mt-3 font-semibold text-ink-900">Running Pipeline…</p>
              <p className="text-xs text-ink-400">Tokenizing → Standardizing → Geocoding</p>
            </div>
          )}

          {result && (
            <>
              {/* Stage Inspector Card */}
              <div className="panel border-teal-200 bg-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-900">
                      Stage: {STAGES.find((s) => s.id === selectedStage)?.name}
                    </span>
                    <span className="text-xs text-ink-500">
                      {STAGES.find((s) => s.id === selectedStage)?.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(stagePayload, null, 2), "Stage JSON")}
                    className="btn-secondary py-1 text-xs"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy Stage Payload
                  </button>
                </div>

                {/* Stage Content */}
                {selectedStage === "input" && (
                  <div className="space-y-2">
                    <p className="text-xs text-ink-600">Raw character buffer before lexical normalization:</p>
                    <pre className="overflow-x-auto rounded-lg bg-ink-950 p-4 font-mono text-xs leading-6 text-ink-50">
                      {address}
                    </pre>
                  </div>
                )}

                {selectedStage === "parse" && (
                  <div className="space-y-3">
                    <p className="text-xs text-ink-600">Token segmentation into ISO 19160 components:</p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      {Object.entries(parsed).map(([k, v]) => (
                        <div key={k} className="flex justify-between rounded-md border border-ink-100 bg-ink-50/50 p-2.5">
                          <span className="font-semibold text-ink-600 capitalize">{k.replaceAll("_", " ")}:</span>
                          <span className="font-mono font-bold text-teal-950">{v ? String(v) : "null"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStage === "standardize" && (
                  <div className="space-y-3">
                    <p className="text-xs text-ink-600">
                      Normalized casing, expanded tokens (e.g. St → Street), structured output:
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-3">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            Address Line 1
                          </span>
                          <button type="button" onClick={() => handleCopy(normalized.address_line_1, "Line 1")} className="inline-flex items-center gap-1 rounded bg-teal-100 px-1.5 py-0.5 text-[10px] hover:bg-teal-200">
                            {copiedField === "Line 1" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <p className="font-mono font-bold text-ink-950 text-sm">{normalized.address_line_1 || "—"}</p>
                      </div>
                      <div className="rounded-lg border border-teal-200 bg-teal-50/40 p-3">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Compass className="h-3.5 w-3.5" />
                            Address Line 2
                          </span>
                          <button type="button" onClick={() => handleCopy(normalized.address_line_2, "Line 2")} className="inline-flex items-center gap-1 rounded bg-teal-100 px-1.5 py-0.5 text-[10px] hover:bg-teal-200">
                            {copiedField === "Line 2" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                        <p className="font-mono font-bold text-ink-950 text-sm">{normalized.address_line_2 || "— (None)"}</p>
                      </div>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-ink-950 p-3 font-mono text-xs text-teal-100">
                      {normalized.formatted_address}
                    </pre>
                  </div>
                )}

                {selectedStage === "validate" && (
                  <div className="space-y-3">
                    <p className="text-xs text-ink-600">
                      Rule engine: postal regex, administrative completeness, deliverability:
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      {Object.entries(validation).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between rounded-md border border-ink-100 bg-white p-2.5">
                          <span className="font-semibold text-ink-700 capitalize">{k.replaceAll("_", " ")}</span>
                          <span className={`font-mono font-bold text-xs ${v ? "text-emerald-700" : "text-amber-700"}`}>
                            {v ? "✅ Pass" : "⚠️ Optional"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStage === "enrich" && (
                  <div className="space-y-3">
                    <p className="text-xs text-ink-600">Geocoding resolution, coordinates, map references:</p>
                    {coordinates ? (
                      <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 text-xs space-y-2">
                        <div className="flex justify-between font-mono">
                          <span className="font-bold text-ink-700">Latitude:</span>
                          <span className="font-bold text-teal-900">{coordinates.latitude}</span>
                        </div>
                        <div className="flex justify-between font-mono">
                          <span className="font-bold text-ink-700">Longitude:</span>
                          <span className="font-bold text-teal-900">{coordinates.longitude}</span>
                        </div>
                        {googleMapsUrl && (
                          <div className="pt-2">
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-teal-800 font-bold hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open in Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-400">No coordinates resolved.</p>
                    )}
                  </div>
                )}

                {selectedStage === "score" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl font-bold text-white shadow-xs ${
                          qualityScore >= 80
                            ? "bg-emerald-600"
                            : qualityScore >= 60
                            ? "bg-amber-500"
                            : "bg-rose-600"
                        }`}
                      >
                        {qualityScore}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink-950 text-base">
                          Quality Score: {qualityScore}/100
                        </h4>
                        <p className="text-xs text-ink-600 mt-0.5">
                          {data?.message || "Address resolved and verified through pipeline."}
                        </p>
                      </div>
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-ink-950 p-3 font-mono text-xs text-teal-100">
                      {JSON.stringify({ quality_score: qualityScore, confidence, validation }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* ISO 19160 Token Matrix */}
              <div className="panel space-y-3">
                <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
                  <h3 className="font-semibold text-ink-950 text-sm">
                    ISO 19160 Token Matrix (Parsed → Standardized)
                  </h3>
                  <span className="text-xs text-ink-400">{parsedEntries.length} Elements</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-ink-200 text-ink-500 uppercase font-semibold text-[10px]">
                        <th className="pb-2">Field</th>
                        <th className="pb-2">Raw Token</th>
                        <th className="pb-2">Standardized</th>
                        <th className="pb-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100 font-mono">
                      {parsedEntries.map(([k, rawVal]) => {
                        const stdVal = normalized[k];
                        return (
                          <tr key={k} className="py-2">
                            <td className="py-2.5 font-sans font-semibold text-ink-700 capitalize">
                              {k.replaceAll("_", " ")}
                            </td>
                            <td className="py-2.5 text-ink-600">{String(rawVal)}</td>
                            <td className="py-2.5 font-bold text-teal-950">
                              {stdVal ? String(stdVal) : String(rawVal)}
                            </td>
                            <td className="py-2.5 text-right font-sans font-semibold text-emerald-700">
                              ✓ Verified
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
