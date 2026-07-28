import { useMemo } from 'react'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import DashboardStats from '@/components/Dashboard/DashboardStats'
import DashboardCharts from '@/components/Dashboard/DashboardCharts'
import ActiveJobsPanel from '@/components/Dashboard/ActiveJobsPanel'
import RecentActivityPanel from '@/components/Dashboard/RecentActivityPanel'
import { useGetDashboardSummary } from '@/components/Dashboard/dashboard-query'
import { useGetJobCardList } from '@/components/JobCard/jobcard-query'
import { useGetVehicleList } from '@/components/Vehicle/vehicle-query'

/** Jobs still occupying a bay, in the order the panel shows them. */
const ACTIVE_STATUSES = ['Open', 'In Progress', 'Awaiting Parts']
const ACTIVE_JOBS_SHOWN = 5

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useGetDashboardSummary()
  const { data: jobs = [] } = useGetJobCardList()
  const { data: vehicles = [] } = useGetVehicleList()

  const activeJobs = useMemo(
    () => jobs.filter((job) => ACTIVE_STATUSES.includes(job.status)).slice(0, ACTIVE_JOBS_SHOWN),
    [jobs],
  )

  if (isLoading) return <LoadingBlock label="Loading dashboard…" />
  if (isError || !summary) return <ErrorBlock />

  // No sticky header here — the dashboard is the home route, so a breadcrumb
  // bar that only ever reads "Dashboard" is noise.
  return (
    <div className="space-y-6">
      <DashboardStats summary={summary} vehicleCount={vehicles.length} />

      <DashboardCharts
        revenueTrend={summary.revenueTrend}
        jobStatusBreakdown={summary.jobStatusBreakdown}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ActiveJobsPanel jobs={activeJobs} />
        <RecentActivityPanel activity={summary.recentActivity} />
      </div>
    </div>
  )
}
