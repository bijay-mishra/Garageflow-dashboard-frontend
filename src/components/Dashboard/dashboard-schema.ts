import type { JobStatus } from '@/components/JobCard/jobcard-schema'


export type ActivityKind = 'job' | 'invoice' | 'customer' | 'vehicle'

export interface IActivity {
  id: string
  at: string
  text: string
  kind: ActivityKind
}

export interface IJobStatusCount {
  status: JobStatus
  count: number
}
export interface IRevenuePoint {
  /** Short month name, e.g. "Jul". */
  label: string
  revenue: number
  jobs: number
}

export interface IDashboardSummary {
  revenueToday: number
  revenueThisMonth: number
  revenueDeltaPct: number
  openJobs: number
  completedThisMonth: number
  vehiclesInShop: number
  activeCustomers: number
  unpaidTotal: number
  jobStatusBreakdown: IJobStatusCount[]
  revenueTrend: IRevenuePoint[]
  recentActivity: IActivity[]
}
/**
 * Running totals behind the sidebar badges — see `useNavBadges`.
 *
 * Totals of everything, not counts of work outstanding. The badge is the
 * difference between this and the number last shown for that section, which
 * only works on a figure that rises as things arrive: a count of open jobs
 * falls as they are finished, and the difference would stay at nought through
 * a day where ten opened and ten closed.
 *
 * `support` is the exception and the API says why — unread is already tracked
 * per thread on the server.
 */
export interface INavCounts {
  customers: number
  vehicles: number
  bookings: number
  jobCards: number
  invoices: number
  deliveries: number
  support: number
}

export const activityDotClass: Record<ActivityKind, string> = {
  job: 'bg-brand-500',
  invoice: 'bg-emerald-500',
  customer: 'bg-violet-500',
  vehicle: 'bg-accent-500',
}
