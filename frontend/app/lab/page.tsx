"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const stages = ["Input", "Parse", "Standardize", "Validate", "Enrich", "Score"];

const SAMPLE_PRESETS = [
  {
    name: "British Museum, UK",
    country: "GB",
    address: "Great Russell Street\nLondon, England, WC1B 3DG\nUnited Kingdom",
  },
  {
    name: "White House, USA",
    country: "US",
    address: "1600 Pennsylvania Avenue NW\nWashington, DC 20500\nUnited States",
  },
  {
    name: "CN Tower, Canada",
    country: "CA",
    address: "290 Bremner Blvd\nToronto, ON M5V 3L9\nCanada",
  },
];

export default function AddressLabPage() {
  const [country, setCountry] = useState("GB");
  const [address, setAddress] = useState(
    "Great Russell Street\nLondon, England, WC1B 3DG\nUnited Kingdom"
  );
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      toast.success("Address processed & validated successfully!");
    } catch (err: any) {
      const msg = err?.message || "Failed to process address";
      setError(msg);
      toast.error(`Processing error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, label = "Address") {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadSample(sample: (typeof SAMPLE_PRESETS)[0]) {
    setCountry(sample.country);
    setAddress(sample.address);
    toast.info(`Loaded sample: ${sample.name}`);
  }

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

  // Filter parsed components: exclude empty values and empty objects (e.g. extras: {})
  const parsedEntries = Object.entries(parsed).filter(([key, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (key === "extras" && typeof value === "object" && Object.keys(value as object).length === 0) {
      return false;
    }
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-teal-700">
            Workspace / Address Lab
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink-950">
            Address Lab
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Interactive playground to parse, standardize, and verify global addresses.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800">
          <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
          Seed-backed verification & Live Geocoding
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Left Form Panel */}
        <section className="panel h-fit space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-950">Input Parameters</h2>
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Quick presets:</span>
            </div>
          </div>

          {/* Quick preset buttons */}
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

          <div>
            <label htmlFor="lab-country" className="mb-1.5 block text-sm font-medium text-ink-800">
              ISO Country Code (2 letters)
            </label>
            <input
              id="lab-country"
              className="field uppercase tracking-wider font-semibold"
              maxLength={2}
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="lab-address" className="text-sm font-medium text-ink-800">
                Raw address
              </label>
              <button
                type="button"
                onClick={() => setAddress("")}
                className="text-xs text-ink-400 hover:text-ink-700"
              >
                Clear
              </button>
            </div>
            <textarea
              id="lab-address"
              className="field min-h-44 font-mono text-sm leading-relaxed"
              value={address}
              placeholder="Enter street, city, postal code..."
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading || !address.trim()}
            onClick={processAddress}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing Address…
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Process Address
              </>
            )}
          </button>

          {error && (
            <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
              <CircleAlert className="h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Processing Failed</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </section>

        {/* Right Inspection Panel */}
        <section className="space-y-5">
          {/* Pipeline stages */}
          <div className="panel py-3">
            <div className="flex flex-wrap items-center gap-2">
              {stages.map((stage, index) => {
                const isPassed = Boolean(result);
                return (
                  <div key={stage} className="flex items-center gap-2 text-xs font-medium text-ink-600">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                        isPassed || index === 0
                          ? "bg-teal-700 text-white shadow-xs"
                          : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {isPassed ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className={isPassed ? "font-semibold text-teal-900" : ""}>{stage}</span>
                    {index < stages.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-ink-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standardized Output Card */}
          <div className="panel border-teal-200/80 bg-gradient-to-br from-white to-teal-50/20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-teal-700" />
                <h2 className="font-semibold text-ink-950">Standardized Output</h2>
                {coordinates && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </span>
                )}
              </div>

              {normalized.formatted_address && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(normalized.formatted_address, "Formatted address")}
                    className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
                  >
                    <Copy className="h-3.5 w-3.5 text-ink-500" />
                    {copied ? "Copied" : "Copy"}
                  </button>

                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-teal-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>

            <pre className="mt-3.5 overflow-auto rounded-lg bg-ink-950 p-4 font-mono text-xs leading-6 text-ink-50 shadow-inner">
              {normalized.formatted_address ?? "Waiting for a result... Click 'Process address' to inspect."}
            </pre>

            {data?.notes && (
              <p className="mt-2.5 text-xs text-ink-600 flex items-center gap-1.5">
                <span className="font-semibold text-teal-800">Landmark / Note:</span>
                <span>{data.notes}</span>
              </p>
            )}
          </div>

          {/* Details Grid: Parsed Components + Validation Evidence */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Parsed Components */}
            <div className="panel">
              <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
                <h2 className="font-semibold text-ink-950">Parsed Components</h2>
                <span className="text-xs text-ink-400">
                  {parsedEntries.length ? `${parsedEntries.length} fields detected` : ""}
                </span>
              </div>
              <dl className="mt-3 divide-y divide-ink-100 text-sm">
                {parsedEntries.map(([key, value]) => {
                  const displayValue =
                    typeof value === "object" ? JSON.stringify(value) : String(value);
                  return (
                    <div key={key} className="flex justify-between gap-3 py-2">
                      <dt className="capitalize text-ink-500 text-xs">
                        {key.replaceAll("_", " ")}
                      </dt>
                      <dd className="text-right font-medium text-ink-900 break-all text-xs font-mono">
                        {displayValue}
                      </dd>
                    </div>
                  );
                })}
                {!result && (
                  <p className="py-4 text-center text-sm text-ink-400">
                    Process an address to inspect parsed fields.
                  </p>
                )}
              </dl>
            </div>

            {/* Validation Evidence */}
            <div className="panel">
              <div className="flex items-center justify-between border-b border-ink-100 pb-2.5">
                <h2 className="font-semibold text-ink-950">Validation Evidence</h2>
                <span className="text-xs text-ink-400">Checks & Signals</span>
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
                            title="Deliverability requires direct postal authority records (USPS DPV / Royal Mail PAF) which confirm mailbox existence."
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
                {!result && (
                  <p className="py-4 text-center text-sm text-ink-400">
                    No validation result yet.
                  </p>
                )}
              </dl>

              {result && (
                <div className="mt-3 rounded-md bg-ink-50 p-2.5 text-[11px] text-ink-600 border border-ink-200">
                  <span className="font-semibold text-ink-800">Note on Deliverability: </span>
                  Geocoded & Map-verified confirms physical existence. Mailbox deliverability requires official carrier registry access (DPV/PAF).
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
