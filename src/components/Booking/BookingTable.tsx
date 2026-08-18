import { useMemo } from 'react'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge from '@/components/common/Badge'
import { useDateFormat } from '@/hooks/useDateFormat'
import { statusLabel, statusTone, type IBooking } from './booking-schema'

interface BookingTableProps extends ServerTableProps {
  data: IBooking[]
  onConfirm: (booking: IBooking) => void
  onDecline: (booking: IBooking) => void
  busyId?: string | null
}

/**
 * Booking list table. Column definitions live here, not in the page.
 *
 * Each column's `key` is sent to the API as `sortBy`, so it has to match a
 * property on the server's BookingDto.
 */
export default function BookingTable({
  data,
  onConfirm,
  onDecline,
  busyId,
  total,
  state,
  onStateChange,
  loading,
}: BookingTableProps) {
  const { date, amount } = useDateFormat()

  const columns = useMemo<Column<IBooking>[]>(
    () => [
      {
        key: 'customerName',
        header: 'Customer',
        sortValue: (b) => b.customerName,
        render: (b) => <span className="text-ink-700">{b.customerName}</span>,
      },
      {
        key: 'customerPhone',
        header: 'Phone',
        sortValue: (b) => b.customerPhone,
        // A link rather than text: the awkward bookings are settled by phone,
        // and on a tablet at the counter this dials.
        render: (b) =>
          b.customerPhone ? (
            <a href={`tel:${b.customerPhone}`} className="text-ink-700 hover:text-brand-700">
              {b.customerPhone}
            </a>
          ) : (
            <span className="text-ink-700">—</span>
          ),
      },
      {
        key: 'vehiclePlate',
        header: 'Vehicle',
        sortValue: (b) => b.vehiclePlate,
        render: (b) => (
          <span className="text-ink-700">
            {b.vehiclePlate}
            <span className="ml-2 text-ink-700">{b.vehicleLabel}</span>
          </span>
        ),
      },
      {
        key: 'complaint',
        header: 'Asked for',
        sortValue: (b) => b.complaint,
        // Truncated rather than wrapped: a complaint can run to a paragraph and
        // one long booking must not set the row height for the whole table.
        render: (b) => (
          <span className="block max-w-[18rem] truncate text-ink-600" title={b.complaint}>
            {b.complaint}
            {b.services.length > 0 && (
              <span className="ml-2 text-xs text-ink-700">+{b.services.length}</span>
            )}
          </span>
        ),
      },
      {
        key: 'preferredDate',
        header: 'Wants it',
        sortValue: (b) => b.preferredDate,
        render: (b) => (
          <span className="text-ink-700">
            {date(b.preferredDate)}
            {b.preferredTime && <span className="ml-2 text-xs text-ink-700">{b.preferredTime}</span>}
          </span>
        ),
      },
      {
        key: 'estimatedTotal',
        header: 'Extras',
        align: 'right',
        sortValue: (b) => b.estimatedTotal,
        // Zero is "nothing quoted yet", not "free": the complaint is unpriced
        // on purpose until somebody has looked at the car.
        render: (b) =>
          b.estimatedTotal > 0 ? (
            <span className="text-ink-700">{amount(b.estimatedTotal)}</span>
          ) : (
            <span className="text-ink-700">—</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (b) => b.status,
        render: (b) => (
          <span className="flex items-center gap-2">
            <Badge tone={statusTone[b.status]}>{statusLabel[b.status]}</Badge>
            {b.status === 'Converted' && b.jobCardId && (
              <span className="text-xs text-ink-700">{b.jobCardId}</span>
            )}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (b) => {
          if (b.status !== 'Requested') {
            return (
              <span
                className="block max-w-[14rem] truncate text-right text-xs text-ink-700"
                title={b.staffNote ?? ''}
              >
                {b.staffNote || '—'}
              </span>
            )
          }

          return (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => onDecline(b)}
                disabled={busyId === b.id}
              >
                Decline
              </button>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={() => onConfirm(b)}
                disabled={busyId === b.id}
              >
                Confirm
              </button>
            </div>
          )
        },
      },
    ],
    [busyId, onConfirm, onDecline, date, amount],
  )

  return (
    <DataTable
      serverMode
      columns={columns}
      data={data}
      rowKey={(b) => b.id}
      itemLabel="bookings"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{
        icon: CalendarDaysIcon,
        title: 'No bookings yet',
        message:
          'When a customer books a service from the app it lands here, with the car, what they asked for and when they want it. Confirm it and it becomes a job card.',
      }}
    />
  )
}
