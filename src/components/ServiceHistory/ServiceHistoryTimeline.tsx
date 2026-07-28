import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/common/Badge'
import { jobStatusTone } from '@/lib/status'
import { formatDate, formatNumber, formatRs } from '@/lib/format'
import type { IJobCard } from '@/components/JobCard/jobcard-schema'

interface ServiceHistoryTimelineProps {
  jobs: IJobCard[]
}

/** Vertical timeline of completed work — the connecting line is the `before:` rule. */
export default function ServiceHistoryTimeline({ jobs }: ServiceHistoryTimelineProps) {
  return (
    <div className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-ink-100">
      {jobs.map((job) => (
        <div key={job.id} className="relative flex gap-4">
          <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-ink-50">
            <WrenchScrewdriverIcon className="h-5 w-5" />
          </div>

          <div className="card flex-1 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ink-900">{job.vehicleLabel}</p>
                  <Badge tone={jobStatusTone(job.status)}>{job.status}</Badge>
                </div>
                <p className="text-xs text-ink-400">
                  {job.id} · {job.vehiclePlate} · {job.customerName}
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-ink-900">{formatRs(job.total)}</p>
                <p className="text-xs text-ink-400">{formatDate(job.completedAt)}</p>
              </div>
            </div>

            <p className="mt-2 text-sm text-ink-600">{job.complaint}</p>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-ink-100 pt-3 text-xs text-ink-500">
              <span>
                Odometer: <b className="text-ink-700">{formatNumber(job.odometer)} km</b>
              </span>
              <span>
                Mechanic: <b className="text-ink-700">{job.mechanic}</b>
              </span>
              <span>
                Parts &amp; labour: <b className="text-ink-700">{job.lines.length} lines</b>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
