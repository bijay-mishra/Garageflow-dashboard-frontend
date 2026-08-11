import { useMemo } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge, { type BadgeTone } from '@/components/common/Badge'
import EntityActions from '@/components/common/buttons/EntityActions'
import { formatAmount } from '@/lib/format'
import {
  appliesToLabel,
  formatDuration,
  type IService,
  type ServiceCategory,
} from './service-schema'

/** Category → badge colour. Washing and detailing sit together at the blue end. */
export const serviceCategoryTone: Record<ServiceCategory, BadgeTone> = {
  Washing: 'cyan',
  Detailing: 'violet',
  Maintenance: 'blue',
  Repair: 'amber',
  Inspection: 'green',
  Convenience: 'emerald',
  Other: 'gray',
}

interface ServiceTableProps extends ServerTableProps {
  data: IService[]
  onEdit: (service: IService) => void
  onDelete: (service: IService) => void
}

/** Each column's `key` is sent to the API as `sortBy`, so it has to match a
 *  property on the server's ServiceDto. */
export default function ServiceTable({
  data,
  onEdit,
  onDelete,
  total,
  state,
  onStateChange,
  loading,
}: ServiceTableProps) {
  const columns = useMemo<Column<IService>[]>(
    () => [
      {
        key: 'name',
        header: 'Service',
        sortValue: (s) => s.name,
        // One line. "(retired)" stays because it sits inline rather than under —
        // and a service still on the list but not on offer has to say so.
        render: (s) => (
          <span className="font-semibold text-ink-900">
            {s.name}
            {!s.isActive && <span className="ml-2 text-xs font-medium text-ink-400">(retired)</span>}
          </span>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        sortValue: (s) => s.category,
        render: (s) => <Badge tone={serviceCategoryTone[s.category]}>{s.category}</Badge>,
      },
      {
        key: 'vehicleTypes',
        header: 'Applies to',
        // Sorting on this would order by the raw comma string, which is
        // meaningless to read, so the column is display-only.
        render: (s) => (
          <span className={s.appliesTo.length === 0 ? 'text-ink-400' : 'text-ink-700'}>
            {appliesToLabel(s.appliesTo)}
          </span>
        ),
      },
      {
        key: 'durationMinutes',
        header: 'Time',
        sortValue: (s) => s.durationMinutes,
        render: (s) => <span className="text-ink-500">{formatDuration(s.durationMinutes)}</span>,
      },
      {
        key: 'price',
        header: 'Price',
        align: 'right',
        sortValue: (s) => s.price,
        render: (s) => <span className="font-bold text-ink-900">{formatAmount(s.price)}</span>,
      },
      {
        key: 'timesUsed',
        header: 'Used',
        align: 'right',
        sortValue: (s) => s.timesUsed,
        render: (s) => (
          <span className={s.timesUsed === 0 ? 'text-ink-300' : 'font-semibold text-ink-700'}>
            {s.timesUsed}
          </span>
        ),
      },
      {
        key: 'isBookable',
        header: 'In app',
        // Sorted as text, not a boolean — the table's comparer handles strings
        // and numbers, and "Bookable" before "Shop only" is the order you want.
        sortValue: (s) => (s.isBookable ? 'Bookable' : 'Shop only'),
        render: (s) =>
          s.isBookable ? (
            <Badge tone="green">Bookable</Badge>
          ) : (
            // Not a failure state — plenty of services are the shop's to add.
            <Badge tone="gray">Shop only</Badge>
          ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (s) => (
          <EntityActions
            label={s.name}
            onEdit={() => onEdit(s)}
            onDelete={() => onDelete(s)}
            className="justify-end"
          />
        ),
      },
    ],
    [onEdit, onDelete],
  )

  return (
    <DataTable
      serverMode
      columns={columns}
      data={data}
      rowKey={(s) => s.id}
      itemLabel="services"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{
        icon: SparklesIcon,
        title: 'No services found',
        message: 'Add what the workshop offers on top of parts and labour — washing, polishing, alignment.',
      }}
    />
  )
}
