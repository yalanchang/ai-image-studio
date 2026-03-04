import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, queryClient, trpcClient } from '../lib/trpc';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const [client] = React.useState(() => trpcClient);
  const [queryClientInstance] = React.useState(() => queryClient);

  return (
    <trpc.Provider client={client} queryClient={queryClientInstance}>
      <QueryClientProvider client={queryClientInstance}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
