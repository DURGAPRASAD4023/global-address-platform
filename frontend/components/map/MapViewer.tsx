"use client";

import dynamic from "next/dynamic";
import type { MapMarker as Marker } from "@/components/map/AddressMap";

export interface MapViewerProps {
  /** Optional title displayed above the map */
  title?: string;
  /** Optional description displayed under the title */
  description?: string;
  /** Markers to display */
  markers: Marker[];
}

const AddressMap = dynamic(() => import("@/components/map/AddressMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-xl border border-ink-200 bg-white/60 text-sm text-ink-500">
      Loading map…
    </div>
  ),
});

export function MapViewer({ title, description, markers }: MapViewerProps) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {title && <h1 className="font-display text-3xl font-bold tracking-tight text-ink-950">{title}</h1>}
      {description && <p className="mt-2 text-ink-600">{description}</p>}
      <div className="mt-6">
        <AddressMap markers={markers} />
      </div>
    </section>
  );
}
