import Link from "next/link";

export default function ApiDocsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-display text-3xl font-bold text-ink-950">API Documentation</h1>
      <p className="mt-3 text-ink-600">
        Interactive OpenAPI docs are served by the FastAPI backend.
      </p>
      <ul className="panel mt-8 list-disc space-y-2 pl-5 text-sm text-ink-700">
        <li>
          <Link className="text-accent-deep underline" href={`${apiUrl}/docs`} target="_blank">
            Swagger UI: {apiUrl}/docs
          </Link>
        </li>
        <li>
          <Link className="text-accent-deep underline" href={`${apiUrl}/redoc`} target="_blank">
            ReDoc: {apiUrl}/redoc
          </Link>
        </li>
        <li>
          <Link className="text-accent-deep underline" href={`${apiUrl}/openapi.json`} target="_blank">
            OpenAPI JSON
          </Link>
        </li>
      </ul>
    </main>
  );
}
