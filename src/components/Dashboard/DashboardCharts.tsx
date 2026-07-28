import Panel from '@/components/common/Panel'
import RevenueChart from '@/components/charts/RevenueChart'
import JobStatusChart from '@/components/charts/JobStatusChart'
import type { IJobStatusCount, IRevenuePoint } from './dashboard-schema'

interface DashboardChartsProps {
  revenueTrend: IRevenuePoint[]
  jobStatusBreakdown: IJobStatusCount[]
}

/** Revenue trend and current workload, side by side. */
export default function DashboardCharts({ revenueTrend, jobStatusBreakdown }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Panel title="Revenue trend" subtitle="Last 6 months" className="lg:col-span-2">
        <RevenueChart data={revenueTrend} />
      </Panel>

      <Panel title="Jobs by status" subtitle="Current workload">
        {jobStatusBreakdown.length ? (
          <JobStatusChart data={jobStatusBreakdown} />
        ) : (
          <p className="py-10 text-center text-sm text-ink-400">No jobs yet.</p>
        )}
      </Panel>
    </div>
  )
}
