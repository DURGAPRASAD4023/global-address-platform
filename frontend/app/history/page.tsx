export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-3xl font-bold text-ink-950">History</h1>
      <p className="mt-3 text-ink-600">
        Optional persistence is off by default. When enabled, only generation metadata is stored,
        not raw user-submitted addresses unless explicitly opted in.
      </p>
      <div className="panel mt-8 text-sm text-ink-500">No history yet.</div>
    </main>
  );
}
