import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-hero-wash">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-fade opacity-70"
        style={{ backgroundSize: "28px 28px" }}
        aria-hidden
      />
      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center px-6 py-16">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent-deep">
          Open-source address intelligence
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink-950 md:text-6xl">
          Global Address Platform
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-600">
          Give us the country. We handle structure, formatting, validation, geocoding, and map
          verification. Paste a raw address and we parse it without inventing corrections.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/generate" className="btn-primary">
            Generate address
          </Link>
          <Link href="/validate" className="btn-secondary">
            Validate address
          </Link>
          <Link href="/map" className="btn-secondary">
            Open map
          </Link>
        </div>
        <dl className="mt-16 grid gap-6 border-t border-ink-200/80 pt-8 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-400">Markets</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink-900">60+</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-400">Statuses</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink-900">Separate evidence</dd>
          </div>
          <div>
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-400">Promise</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink-900">No hallucination</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
