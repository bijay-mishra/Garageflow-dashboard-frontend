import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

/** Central registry of query keys — one place to look when invalidating caches. */
export const qk = {
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  vehicles: ['vehicles'] as const,
  vehiclesByCustomer: (id: string) => ['vehicles', 'byCustomer', id] as const,
  jobCards: ['jobCards'] as const,
  jobCard: (id: string) => ['jobCards', id] as const,
  invoices: ['invoices'] as const,
  dashboard: ['dashboard'] as const,
}
