import { useState } from 'react'
import Dropdown from '@/components/common/form/Dropdown'
import Badge from '@/components/common/Badge'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useGetMechanicList } from '@/components/Staff/staff-query'
import type { IBooking } from './booking-schema'

interface BookingConfirmModalProps {
  booking: IBooking
  busy: boolean
  onClose: () => void
  /** Confirms, then creates the job card. `mechanic` is optional. */
  onConfirm: (mechanic?: string) => void
}

/**
 * The whole booking, before anyone commits to it.
 *
 * Confirming used to be a single tap straight off the row, which was wrong in
 * both directions: the advisor was agreeing to a date and a piece of work they
 * could only half see, and the customer got an answer nobody had really read.
 * The awkward cases — wrong day, car not drivable, extras the shop does not do
 * — are exactly the ones the truncated row hides, so this shows the lot and
 * puts their phone number next to it.
 *
 * Confirming and creating the job card are one action here rather than two
 * screens. A confirmed booking that never became a job is a promise nobody is
 * working on, and that gap is the whole reason the workshop missed these in the
 * first place.
 */
export default function BookingConfirmModal({
  booking,
  busy,
  onClose,
  onConfirm,
}: BookingConfirmModalProps) {
  const { date, amount } = useDateFormat()
  const { data: mechanics = [] } = useGetMechanicList()

  // Optional on purpose. Plenty of workshops decide who is doing what at the
  // bench rather than at the counter, and forcing a name here would mean
  // picking one at random to get past the dialog.
  const [mechanic, setMechanic] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-ink-100 bg-white shadow-lg">
        <div className="border-b border-ink-100 px-5 py-4">
          <p className="text-sm font-semibold text-ink-800">Confirm this booking</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {booking.customerName} is told straight away, and a job card is created.
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          <Row label="Customer">
            <span className="text-ink-800">{booking.customerName}</span>
            {booking.customerPhone && (
              <a
                href={`tel:${booking.customerPhone}`}
                className="ml-2 text-brand-600 hover:text-brand-700"
              >
                {booking.customerPhone}
              </a>
            )}
          </Row>

          <Row label="Vehicle">
            <span className="text-ink-800">{booking.vehiclePlate}</span>
            <span className="ml-2 text-ink-500">{booking.vehicleLabel}</span>
          </Row>

          <Row label="Wants it">
            <span className="text-ink-800">{date(booking.preferredDate)}</span>
            {booking.preferredTime && (
              <span className="ml-2 text-ink-500">{booking.preferredTime}</span>
            )}
          </Row>

          {/* Full text, wrapped. This is the field the table has to truncate,
              and it is the one worth reading before agreeing to a date. */}
          <Row label="Asked for">
            <span className="whitespace-pre-wrap text-ink-800">{booking.complaint}</span>
          </Row>

          {booking.services.length > 0 && (
            <Row label="Extras">
              <span className="flex flex-wrap gap-1.5">
                {booking.services.map((s) => (
                  <Badge key={s.serviceId} tone="cyan">
                    {s.name} · {amount(s.price)}
                  </Badge>
                ))}
              </span>
              <p className="mt-1.5 text-xs text-ink-500">
                Quoted at {amount(booking.estimatedTotal)} — held at the price the customer was
                shown. The complaint itself is not priced until someone has looked at the car.
              </p>
            </Row>
          )}

          <div className="border-t border-ink-100 pt-3">
            <label className="mb-1.5 block text-xs font-semibold text-ink-600">
              Assign a mechanic <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <Dropdown
              className="w-full"
              placeholder={mechanics.length ? 'Decide later' : 'No mechanics on staff yet'}
              value={mechanic}
              onChange={(next) => setMechanic((next as string | null) ?? null)}
              options={mechanics.map((m) => ({ value: m, label: m }))}
              isSearchable={mechanics.length > 8}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3">
          <button type="button" className="btn-ghost text-xs" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() => onConfirm(mechanic ?? undefined)}
            disabled={busy}
          >
            {busy ? 'Working…' : 'Confirm & create job card'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Label left, value right — the same two-column read as the job card panel. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
      <span className="pt-0.5 text-xs font-semibold text-ink-500">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}
