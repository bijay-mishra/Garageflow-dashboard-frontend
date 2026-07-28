import { Link } from 'react-router-dom'
import Panel from '@/components/common/Panel'
import Badge from '@/components/common/Badge'
import { jobStatusTone, priorityTone } from '@/lib/status'
import { formatRs } from '@/lib/format'
import type { IJobCard } from '@/components/JobCard/jobcard-schema'

interface ActiveJobsPanelProps {
  jobs: IJobCard[]
}

/** The handful of jobs currently on the ramp. */
export default function ActiveJobsPanel({ jobs }: ActiveJobsPanelProps) {
  return (
    <Panel
      title="Jobs in progress"
      subtitle="Vehicles currently on the ramp"
      className="lg:col-span-2"
      bodyClassName=""
      action={
        <Link to="/job-cards" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
          View all
        </Link>
      }
    >
      <div className="divide-y divide-ink-100">
        {jobs.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-400">No active jobs. All caught up! 🎉</p>
        )}

        {jobs.map((job) => (
          <div key={job.id} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink-900">{job.vehicleLabel}</p>
                <Badge tone={priorityTone(job.priority)}>{job.priority}</Badge>
              </div>
              <p className="truncate text-xs text-ink-400">
                {job.id} · {job.vehiclePlate} · {job.mechanic}
              </p>
            </div>

            <Badge tone={jobStatusTone(job.status)} dot>
              {job.status}
            </Badge>
            <span className="hidden text-sm font-semibold text-ink-700 sm:block">{formatRs(job.total)}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
