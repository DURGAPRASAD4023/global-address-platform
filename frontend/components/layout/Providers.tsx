"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 10, // 10 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: true, // Automatically retry if user switches back to tab after cold start
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
          },
        },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <Toaster position="top-right" richColors closeButton />
      {children}
    </QueryClientProvider>
  );
}
