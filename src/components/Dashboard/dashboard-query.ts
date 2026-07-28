import { useQuery } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { dashboardApi } from './dashboard-api'
import type { IDashboardSummary } from './dashboard-schema'

/**
 * Every figure the dashboard home page needs, in one request.
 *
 * Mutations across the app invalidate `GET_DASHBOARD_SUMMARY` so these numbers
 * follow the data that produced them.
 */
export const useGetDashboardSummary = (enabled = true) =>
  useQuery({
    queryKey: [dashboardApi.getDashboardSummary.actionName],
    queryFn: () => initApiRequest<IDashboardSummary>({ apiDetails: dashboardApi.getDashboardSummary }),
    enabled,
    select: (res) => res?.data?.data ?? null,
  })
