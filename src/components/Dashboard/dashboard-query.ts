import { useQuery } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { dashboardApi } from './dashboard-api'
import type { IDashboardSummary } from './dashboard-schema'

export const useGetDashboardSummary = (enabled = true) =>
  useQuery({
    queryKey: [dashboardApi.getDashboardSummary.actionName],
    queryFn: () => initApiRequest<IDashboardSummary>({ apiDetails: dashboardApi.getDashboardSummary }),
    enabled,
    select: (res) => res?.data?.data ?? null,
  })
