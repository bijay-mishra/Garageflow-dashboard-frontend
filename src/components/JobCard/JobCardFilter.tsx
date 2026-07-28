import TableFilterBar from '@/components/common/table/TableFilterBar'
import FilterDropdown, { ALL } from '@/components/common/table/FilterDropdown'
import { JOB_STATUSES, type JobStatus } from './jobcard-schema'

/** A job status, or `All` for no status filter. */
export type JobStatusFilter = JobStatus | typeof ALL

interface JobCardFilterProps {
  search: string
  onSearchChange: (value: string) => void
  status: JobStatusFilter
  onStatusChange: (value: JobStatusFilter) => void
}

/**
 * Search box plus a status dropdown above the job card table.
 *
 * List view only — the board already lays jobs out in a column per status, so
 * filtering to one status there would just leave a single column standing.
 */
export default function JobCardFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: JobCardFilterProps) {
  return (
    <TableFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search job, plate, mechanic…"
    >
      <FilterDropdown
        placeholder="All statuses"
        options={JOB_STATUSES}
        value={status}
        onChange={onStatusChange}
        className="w-full sm:w-44"
      />
    </TableFilterBar>
  )
}
