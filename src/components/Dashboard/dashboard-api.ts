import { RequestMethod } from '@/lib/api-types'

// ── Dashboard endpoints ──────────────────────────────────────────────────────
// One aggregate call rather than a dozen counts: every figure on the home page
// is computed server-side in a single round trip.

export const dashboardApi = {
  getDashboardSummary: {
    actionName: 'GET_DASHBOARD_SUMMARY',
    controllerName: '/dashboard/summary',
    requestMethod: RequestMethod.GET,
  },
} as const
