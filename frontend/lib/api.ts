import type { Country } from "@/types/address";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      body?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return (body.data ?? body) as T;
}

export const api = {
  listCountries: () =>
    request<{ count: number; countries: Country[] }>("/api/v1/countries"),

  generateAddress: (country: string, source: string = "live") =>
    request<unknown>("/api/v1/addresses/generate", {
      method: "POST",
      body: JSON.stringify({ country, source }),
    }),

  validateAddress: (country: string, address: string) =>
    request<unknown>("/api/v1/addresses/validate", {
      method: "POST",
      body: JSON.stringify({ country, address }),
    }),

  batchValidate: (country: string, addresses: string[]) =>
    request<{ batch_id: string; status: string; total: number; completed: number; failed: number; results: Array<Record<string, unknown>> }>(
      "/api/v1/batches/validate",
      { method: "POST", body: JSON.stringify({ country, addresses }) },
    ),
};
