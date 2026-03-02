import { trpc } from "@/lib/trpc";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;

// Stable QueryClient — created once outside React tree
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Query Error]", event.query.state.error);
  }
});

queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    console.error("[API Mutation Error]", event.mutation.state.error);
  }
});

/**
 * TrpcProvider — must live inside Auth0Provider so it can call useAuth0.
 * The tRPC client is memoised on `isAuthenticated` so it is only recreated
 * when the auth state actually changes (logged-in ↔ logged-out), NOT on every render.
 */
function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  // Keep a stable ref to getAccessTokenSilently so the fetch closure below
  // always calls the latest version without triggering a client rebuild.
  const getTokenRef = useRef(getAccessTokenSilently);
  getTokenRef.current = getAccessTokenSilently;

  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: "/api/trpc",
            transformer: superjson,
            async fetch(input, init) {
              const headers: Record<string, string> = {};

              if (isAuthenticated) {
                try {
                  const token = await getTokenRef.current({
                    authorizationParams: AUTH0_AUDIENCE
                      ? { audience: AUTH0_AUDIENCE }
                      : undefined,
                  });
                  if (token) headers["Authorization"] = `Bearer ${token}`;
                } catch {
                  // Token refresh failed — proceed unauthenticated
                }
              }

              return globalThis.fetch(input, {
                ...(init ?? {}),
                credentials: "include",
                headers: {
                  ...(init?.headers as Record<string, string> | undefined),
                  ...headers,
                },
              });
            },
          }),
        ],
      }),
    // Only rebuild the client when auth state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated]
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={AUTH0_DOMAIN}
    clientId={AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
      scope: "openid profile email",
    }}
    onRedirectCallback={(appState) => {
      window.history.replaceState(
        {},
        document.title,
        appState?.returnTo ?? window.location.pathname
      );
    }}
  >
    <TrpcProvider>
      <App />
    </TrpcProvider>
  </Auth0Provider>
);
