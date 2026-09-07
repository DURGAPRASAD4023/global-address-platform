const steps = ["Generating…", "Validating…", "Geocoding…", "Verifying map location…"];

export function StatusPipeline() {
  return (
    <ol className="space-y-2 font-mono text-sm text-ink-600" aria-live="polite">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <span style={{ animationDelay: `${i * 120}ms` }}>{step}</span>
        </li>
      ))}
    </ol>
  );
}
