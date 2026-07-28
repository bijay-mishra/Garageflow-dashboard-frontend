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
export const activityDotClass: Record<ActivityKind, string> = {
  job: 'bg-brand-500',
  invoice: 'bg-emerald-500',
  customer: 'bg-violet-500',
  vehicle: 'bg-accent-500',
}
