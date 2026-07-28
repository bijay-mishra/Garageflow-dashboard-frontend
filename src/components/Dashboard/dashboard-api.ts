import { RequestMethod } from '@/lib/api-types'

export const dashboardApi = {
  getDashboardSummary: {
    actionName: 'GET_DASHBOARD_SUMMARY',
    controllerName: '/dashboard/summary',
    requestMethod: RequestMethod.GET,
  },
} as const
