import type { JobStatus } from '@/components/JobCard/jobcard-schema'

// ── Dashboard contract ───────────────────────────────────────────────────────
// Read-only, so there is no Yup schema here — just the shape of
// `GET /api/dashboard/summary`.

export type ActivityKind = 'job' | 'invoice' | 'customer' | 'vehicle'

/** One entry in the recent-activity feed. */
export interface IActivity {
  id: string
  /** ISO datetime. */
  at: string
  text: string
  kind: ActivityKind
}

export interface IJobStatusCount {
  status: JobStatus
  count: number
}

/** One month on the revenue trend chart. */
export interface IRevenuePoint {
  /** Short month name, e.g. "Jul". */
  label: string
  revenue: number
  jobs: number
}

export interface IDashboardSummary {
  revenueToday: number
  revenueThisMonth: number
  /** Percentage change against the previous calendar month. */
  revenueDeltaPct: number
  openJobs: number
  completedThisMonth: number
  vehiclesInShop: number
  activeCustomers: number
  /** Unpaid + partial invoice balances. */
  unpaidTotal: number
  jobStatusBreakdown: IJobStatusCount[]
  revenueTrend: IRevenuePoint[]
  recentActivity: IActivity[]
}

/** Feed dot colour per activity kind. */
export const activityDotClass: Record<ActivityKind, string> = {
  job: 'bg-brand-500',
  invoice: 'bg-emerald-500',
  customer: 'bg-violet-500',
  vehicle: 'bg-accent-500',
}
