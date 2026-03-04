import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "../../../server/routers";

// 創建 tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const getToken = (): string | undefined => {
  try {
    const auth0Key = Object.keys(localStorage).find(key => 
      key.includes('@@auth0spajs@@')
    );
    
    if (auth0Key) {
      const data = localStorage.getItem(auth0Key);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.access_token || parsed.token;
      }
    }
  } catch (e) {
    console.error('Error getting token:', e);
  }
  return undefined;
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
      headers: (() => {
        const token = getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      }) as any, 
    }),
  ],
} as any); 

export type TRPCClient = typeof trpcClient;
