"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MapViewer } from "@/components/map/MapViewer";

function MapContent() {
  const searchParams = useSearchParams();
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));
  const hasResult = Number.isFinite(lat) && Number.isFinite(lon);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink-950">Map</h1>
      <p className="mt-2 text-ink-600">
        Interactive OpenStreetMap view for generated and validated addresses.
      </p>
      <div className="mt-6">
        <MapViewer
          markers={[
            {
              id: "demo-london",
              lat: hasResult ? lat : 51.5074,
              lon: hasResult ? lon : -0.1278,
              label: "London (demo marker, replace with live results)",
            },
          ]}
        />
      </div>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-6 py-10 text-sm text-ink-500">Loading map...</div>}>
      <MapContent />
    </Suspense>
  );
}
