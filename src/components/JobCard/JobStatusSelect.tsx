import { JOB_STATUSES, type JobStatus } from './jobcard-schema'

interface JobStatusSelectProps {
  value: JobStatus
  onChange: (status: JobStatus) => void
  className?: string
}

/**
 * Inline status switcher used on both the board cards and the list rows —
 * changing status is the single most common action on a job card, so it stays
 * one click away without opening the form.
 */
export default function JobStatusSelect({ value, onChange, className = '' }: JobStatusSelectProps) {
  return (
    <select
      value={value}
      aria-label="Job status"
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as JobStatus)}
      className={`rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-semibold text-ink-700 ${className}`}
    >
      {JOB_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  )
}
