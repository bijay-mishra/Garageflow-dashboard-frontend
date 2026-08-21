import { useQuery } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { dashboardApi } from './dashboard-api'
import type { IDashboardSummary, INavCounts } from './dashboard-schema'

export const useGetDashboardSummary = (enabled = true) =>
  useQuery({
    queryKey: [dashboardApi.getDashboardSummary.actionName],
    queryFn: () => initApiRequest<IDashboardSummary>({ apiDetails: dashboardApi.getDashboardSummary }),
    enabled,
    select: (res) => res?.data?.data ?? null,
  })

/**
 * The running totals behind the sidebar badges.
 *
 * Polled, because the point of a badge is to appear without being asked for —
 * a booking that lands while somebody is on the billing screen has to show up
 * there, not on their next full page load. A minute is slow enough to be free
 * (seven `COUNT(*)`s) and quick enough that nobody notices the delay.
 */
export const useGetNavCounts = (enabled = true) =>
  useQuery({
    queryKey: [dashboardApi.getNavCounts.actionName],
    queryFn: () => initApiRequest<INavCounts>({ apiDetails: dashboardApi.getNavCounts }),
    enabled,
    refetchInterval: 60_000,
    // Kept running with the tab in the background, so coming back to a window
    // left open over lunch shows what arrived rather than what was there when
    // it lost focus.
    refetchIntervalInBackground: true,
    select: (res) => res?.data?.data ?? null,
  })
