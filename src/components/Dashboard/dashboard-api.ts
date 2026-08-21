import { RequestMethod } from '@/lib/api-types'

export const dashboardApi = {
  getDashboardSummary: {
    actionName: 'GET_DASHBOARD_SUMMARY',
    controllerName: '/dashboard/summary',
    requestMethod: RequestMethod.GET,
  },
  getNavCounts: {
    actionName: 'GET_NAV_COUNTS',
    controllerName: '/dashboard/nav-counts',
    requestMethod: RequestMethod.GET,
  },
} as const
