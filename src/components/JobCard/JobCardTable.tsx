import { useMemo } from 'react'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge from '@/components/common/Badge'
import EntityActions from '@/components/common/buttons/EntityActions'
import { priorityTone } from '@/lib/status'
import { formatDate, formatRs } from '@/lib/format'
import JobStatusSelect from './JobStatusSelect'
import { JOB_PRIORITIES, JOB_STATUSES, type IJobCard, type JobStatus } from './jobcard-schema'

interface JobCardTableProps extends ServerTableProps {
  data: IJobCard[]
  onEdit: (job: IJobCard) => void
  onDelete: (job: IJobCard) => void
  onStatusChange: (job: IJobCard, status: JobStatus) => void
}

/** Each column's `key` is sent to the API as `sortBy`, so it has to match a
 *  property on the server's JobCardDto. */
export default function JobCardTable({
  data,
  onEdit,
  onDelete,
  onStatusChange,
  total,
  state,
  onStateChange,
  loading,
}: JobCardTableProps) {
  const columns = useMemo<Column<IJobCard>[]>(
    () => [
      {
        key: 'id',
        header: 'Job',
        sortValue: (j) => j.id,
        render: (j) => (
          <>
            <p className="font-semibold text-ink-900">{j.id}</p>
            <p className="max-w-[200px] truncate text-xs text-ink-400">{j.complaint}</p>
          </>
        ),
      },
      {
        key: 'vehicleLabel',
        header: 'Vehicle',
        sortValue: (j) => j.vehicleLabel,
        render: (j) => (
          <>
            <p className="text-ink-800">{j.vehicleLabel}</p>
            <p className="text-xs text-ink-400">{j.vehiclePlate}</p>
          </>
        ),
      },
      {
        key: 'mechanic',
        header: 'Mechanic',
        sortValue: (j) => j.mechanic,
        render: (j) => <span className="text-ink-700">{j.mechanic}</span>,
      },
      {
        // Server-side this sorts alphabetically, not by severity — the API
        // stores priority as a string. Sort by status for workload order.
        key: 'priority',
        header: 'Priority',
        sortValue: (j) => JOB_PRIORITIES.indexOf(j.priority),
        render: (j) => <Badge tone={priorityTone(j.priority)}>{j.priority}</Badge>,
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (j) => JOB_STATUSES.indexOf(j.status),
        render: (j) => <JobStatusSelect value={j.status} onChange={(status) => onStatusChange(j, status)} />,
      },
      {
        key: 'promisedAt',
        header: 'Promised',
        sortValue: (j) => j.promisedAt,
        render: (j) => <span className="text-ink-500">{formatDate(j.promisedAt)}</span>,
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right',
        sortValue: (j) => j.total,
        render: (j) => <span className="font-semibold text-ink-900">{formatRs(j.total)}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (j) => (
          <EntityActions label={j.id} onEdit={() => onEdit(j)} onDelete={() => onDelete(j)} className="justify-end" />
        ),
      },
    ],
    [onEdit, onDelete, onStatusChange],
  )

  return (
    <DataTable
      serverMode
      columns={columns}
      data={data}
      rowKey={(j) => j.id}
      itemLabel="job cards"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{
        icon: ClipboardDocumentListIcon,
        title: 'No job cards',
        message: 'Open a new job card to get started.',
      }}
    />
  )
}
