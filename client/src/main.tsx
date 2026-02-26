import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

/**
 * Global QueryClient with aggressive retry for connection resilience.
 * This ensures that transient DB errors (TiDB cold starts, ECONNRESET)
 * are automatically retried without user intervention.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 5,                    // Up to 5 retries for queries
      retryDelay: (attemptIndex) => Math.min(800 * Math.pow(2, attemptIndex), 10000),
      staleTime: 30000,            // Data stays fresh for 30s (reduces re-fetches)
      refetchOnWindowFocus: false,  // Don't refetch on tab focus (reduces load)
      networkMode: 'always',       // Always try even if navigator.onLine is false
    },
    mutations: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 8000),
      networkMode: 'always',
    },
  },
});

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Query Error]", event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
