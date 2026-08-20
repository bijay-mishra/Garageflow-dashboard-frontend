import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowTopRightOnSquareIcon, BoltIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge from '@/components/common/Badge'
import { useDateFormat } from '@/hooks/useDateFormat'
import { queueBadge, statusLabel, statusTone, type IBooking } from './booking-schema'

interface BookingTableProps extends ServerTableProps {
  data: IBooking[]
  onConfirm: (booking: IBooking) => void
  onDecline: (booking: IBooking) => void
  /** Confirmed but never turned into work — the row's Assign button. */
  onAssign: (booking: IBooking) => void
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
  onAssign,
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
        key: 'queuePosition',
        header: 'Queue',
        // Not sortable. The server ranks the whole waiting set — urgent first,
        // then oldest — and sorting this column by its own value would either
        // reproduce that order or contradict it.
        render: (b) => {
          const queue = queueBadge(b)

          if (!queue) return <span className="text-xs text-ink-400">—</span>

          return (
            <span className="flex items-center gap-2">
              <Badge tone={queue.tone}>
                {b.isUrgent && <BoltIcon className="h-3 w-3" />}
                {queue.label}
              </Badge>

              {/* The fee, not just the word. It is a line the customer will see
                  on their bill, and an advisor explaining why this car went
                  first should not have to look the number up. */}
              {b.isUrgent && b.urgentFee > 0 ? (
                <span className="text-xs font-semibold text-violet-700">
                  {amount(b.urgentFee)}
                </span>
              ) : (
                queue.hint && <span className="text-xs text-ink-400">{queue.hint}</span>
              )}
            </span>
          )
        },
      },
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

            {/* Where the booking ended up, and a way to get there. Reading the
                job number off this row and then searching for it by hand was
                the last step of this screen with no link on it. */}
            {b.status === 'Converted' && b.jobCardId && (
              <Link
                to={`/job-cards?q=${encodeURIComponent(b.jobCardId)}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                {b.jobCardId}
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </Link>
            )}

            {/* A confirmed booking with no job card is the gap this page exists
                to close: somebody was promised a day and nobody here is working
                on it. Saying so plainly is the point. */}
            {b.status === 'Confirmed' && !b.jobCardId && (
              <span className="text-xs font-semibold text-accent-700">Not assigned</span>
            )}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (b) => {
          if (b.status === 'Requested') {
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
          }

          // Confirmed and still unassigned. Before this there was no way back:
          // confirming was the only route to a job card, so a booking answered
          // yesterday could never be turned into one from this screen.
          if (b.status === 'Confirmed' && !b.jobCardId) {
            return (
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={() => onAssign(b)}
                disabled={busyId === b.id}
              >
                Assign
              </button>
            )
          }

          return (
            <span
              className="block max-w-[14rem] truncate text-right text-xs text-ink-700"
              title={b.staffNote ?? ''}
            >
              {b.staffNote || '—'}
            </span>
          )
        },
      },
    ],
    [busyId, onConfirm, onDecline, onAssign, date, amount],
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
