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

/**
 * Marks a cache entry stale **without** issuing a request.
 *
 * The default `invalidateQueries` refetches every *active* match immediately —
 * so a mutation that ripples across features (a new vehicle changes its owner's
 * `vehicleCount`, a paid invoice changes the dashboard revenue) fires a network
 * call for each one, from whatever screen you happen to be on.
 *
 * Use this for the knock-on effects instead. The data is discarded, and the
 * refetch happens the next time a component actually mounts that query — i.e.
 * when you navigate to the screen that shows it. Use a plain
 * `invalidateQueries` only for the list the user is currently looking at.
 */
export const invalidateInBackground = (client: QueryClient, queryKey: readonly unknown[]) =>
  client.invalidateQueries({ queryKey, refetchType: 'none' })
