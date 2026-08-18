import { useState } from 'react'
import StickyHeader from '@/components/common/headers/StickyHeader'
import TableFilterBar from '@/components/common/table/TableFilterBar'
import Dropdown from '@/components/common/form/Dropdown'
import { ALL } from '@/components/common/table/FilterDropdown'
import { ErrorBlock } from '@/components/common/loaders/States'
import Badge from '@/components/common/Badge'
import BookingTable from '@/components/Booking/BookingTable'
import BookingConfirmModal from '@/components/Booking/BookingConfirmModal'
import {
  useConvertBooking,
  useGetBookingListPaged,
  useRespondToBooking,
} from '@/components/Booking/booking-query'
import {
  BOOKING_STATUSES,
  statusLabel,
  type BookingStatus,
  type IBooking,
} from '@/components/Booking/booking-schema'
import { useSearchQuery } from '@/hooks/useSearchQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'

/**
 * Service requests coming in from the customer app.
 *
 * The workshop's end of a loop that used to have no end: a customer could book
 * from their phone and nothing on this side ever said so, because the API had
 * the bookings and no screen asked for them. Somebody would ring up about an
 * appointment nobody here knew about.
 *
 * Requested first, always. A booking that has been answered is a record; one
 * that has not is a customer waiting, and the second is the only reason to open
 * this page — which is what the count in the header is.
 */
export default function Bookings() {
  const [query, setQuery] = useSearchQuery()
  const search = useDebouncedValue(query)
  const [status, setStatus] = useState<BookingStatus | typeof ALL>('All')

  const [confirming, setConfirming] = useState<IBooking | null>(null)
  const [declining, setDeclining] = useState<IBooking | null>(null)
  const [note, setNote] = useState('')

  const statusParam = status === 'All' ? undefined : status

  const table = useTableState({ pageSize: 20 }, [search, statusParam])
  const { data, isFetching, isError } = useGetBookingListPaged(
    table.toQuery({ search, status: statusParam }),
  )

  const respond = useRespondToBooking()
  const convert = useConvertBooking()

  const rows = data?.list ?? []
  const waiting = rows.filter((b) => b.status === 'Requested').length

  const busy = respond.isPending || convert.isPending
  const busyId = respond.isPending
    ? respond.variables?.id
    : convert.isPending
      ? convert.variables?.id
      : null

  /**
   * Confirm and create the job card, in that order.
   *
   * Chained rather than fired together: `convert` refuses a booking that is not
   * yet Confirmed, so running them in parallel would race and lose the job card
   * about half the time.
   */
  const confirmBooking = (mechanic?: string) => {
    if (!confirming) return

    respond.mutate(
      { id: confirming.id, status: 'Confirmed' },
      {
        onSuccess: () =>
          convert.mutate(
            { id: confirming.id, mechanic },
            { onSuccess: () => setConfirming(null) },
          ),
      },
    )
  }

  const declineBooking = () => {
    if (!declining) return

    respond.mutate(
      { id: declining.id, status: 'Rejected', staffNote: note.trim() || undefined },
      { onSuccess: () => setDeclining(null) },
    )
  }

  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Bookings" subtitle="Service requests from the customer app">
        {waiting > 0 && (
          <Badge tone="amber" dot>
            {waiting} waiting on you
          </Badge>
        )}
      </StickyHeader>

      <div className="card overflow-hidden">
        <TableFilterBar
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search customer, plate, complaint…"
        >
          {/* A plain Dropdown rather than FilterDropdown: that one uses the raw
              value as its label, and "Rejected" reads harsher than it means
              while "Converted" means nothing to an advisor. */}
          <Dropdown
            className="w-full sm:w-44"
            placeholder="All bookings"
            value={status === ALL ? null : status}
            onChange={(next) => setStatus((next as BookingStatus | null) ?? ALL)}
            options={BOOKING_STATUSES.map((s) => ({ value: s, label: statusLabel[s] }))}
            isSearchable={false}
          />
        </TableFilterBar>

        <BookingTable
          data={rows}
          total={data?.count ?? 0}
          state={table.state}
          onStateChange={table.setState}
          loading={isFetching}
          busyId={busyId}
          onConfirm={setConfirming}
          onDecline={(b) => {
            setNote('')
            setDeclining(b)
          }}
        />
      </div>

      {confirming && (
        <BookingConfirmModal
          booking={confirming}
          busy={busy}
          onClose={() => setConfirming(null)}
          onConfirm={confirmBooking}
        />
      )}

      {declining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-ink-100 bg-white p-5 shadow-lg">
            <p className="text-sm font-semibold text-ink-800">
              Decline {declining.vehiclePlate}?
            </p>
            <p className="mt-1 text-xs text-ink-500">
              {declining.customerName} is told straight away. Whatever you write here is what
              they read, so it is worth a sentence.
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              autoFocus
              placeholder="Fully booked that day — could we do the Thursday instead?"
              className="input mt-3 resize-none"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => setDeclining(null)}
                disabled={busy}
              >
                Keep it
              </button>
              <button
                type="button"
                className="btn-primary text-xs"
                onClick={declineBooking}
                disabled={busy}
              >
                Decline booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
