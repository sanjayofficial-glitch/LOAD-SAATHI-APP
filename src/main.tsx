import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import App from './App';
import './globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min: don't re-fetch if data is fresh
      gcTime: 1000 * 60 * 10,        // 10 min: keep unused data in cache
      retry: 1,                       // only retry failed requests once
      refetchOnWindowFocus: false,    // don't refetch on tab switch
      refetchOnReconnect: true,       // do refetch when internet comes back
    },
    mutations: {
      retry: 0,                       // never retry failed writes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);