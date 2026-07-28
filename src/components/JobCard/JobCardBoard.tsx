import Badge from '@/components/common/Badge'
import EntityActions from '@/components/common/buttons/EntityActions'
import { jobStatusTone, priorityTone } from '@/lib/status'
import { formatRs } from '@/lib/format'
import JobStatusSelect from './JobStatusSelect'
import { BOARD_STATUSES, type IJobCard, type JobStatus } from './jobcard-schema'

interface JobCardBoardProps {
  data: IJobCard[]
  onEdit: (job: IJobCard) => void
  onDelete: (job: IJobCard) => void
  onStatusChange: (job: IJobCard, status: JobStatus) => void
}

/**
 * Kanban view of the workshop floor — one column per in-shop status.
 * Delivered and Cancelled jobs are deliberately absent: the board is about
 * what still needs doing, and the list view covers the rest.
 */
export default function JobCardBoard({ data, onEdit, onDelete, onStatusChange }: JobCardBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {BOARD_STATUSES.map((status) => {
        const items = data.filter((job) => job.status === status)

        return (
          <div key={status} className="flex flex-col rounded-lg bg-ink-100/60 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <Badge tone={jobStatusTone(status)} dot>
                {status}
              </Badge>
              <span className="text-xs font-bold text-ink-400">{items.length}</span>
            </div>

            <div className="space-y-3">
              {items.map((job) => (
                <JobBoardCard
                  key={job.id}
                  job={job}
                  onEdit={() => onEdit(job)}
                  onDelete={() => onDelete(job)}
                  onStatusChange={(next) => onStatusChange(job, next)}
                />
              ))}
              {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-ink-400">Empty</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface JobBoardCardProps {
  job: IJobCard
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: JobStatus) => void
}

/** One job as a board tile. */
function JobBoardCard({ job, onEdit, onDelete, onStatusChange }: JobBoardCardProps) {
  return (
    <div className="card p-3.5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-900">{job.vehicleLabel}</p>
          <p className="text-xs text-ink-400">
            {job.id} · {job.vehiclePlate}
          </p>
        </div>
        <Badge tone={priorityTone(job.priority)}>{job.priority}</Badge>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-ink-500">{job.complaint}</p>

      <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
        <span className="text-xs text-ink-400">{job.mechanic}</span>
        <span className="text-sm font-bold text-ink-900">{formatRs(job.total)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <JobStatusSelect value={job.status} onChange={onStatusChange} className="flex-1 py-1.5" />
        <EntityActions label={job.id} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}
