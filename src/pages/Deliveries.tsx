import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { TruckIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import Dropdown from '@/components/common/form/Dropdown'
import { ALL } from '@/components/common/table/FilterDropdown'
import { ErrorBlock, Spinner } from '@/components/common/loaders/States'
import Badge from '@/components/common/Badge'
import DeliveryTable from '@/components/Delivery/DeliveryTable'
import {
  useCompleteDelivery,
  useGetDeliveryListPaged,
  useGetDeliveryTrack,
  useStartDelivery,
} from '@/components/Delivery/delivery-query'
import {
  DELIVERY_STATUSES,
  freshness,
  isLive,
  methodLabel,
  statusLabel,
  statusTone,
  type DeliveryStatus,
  type IDelivery,
} from '@/components/Delivery/delivery-schema'
import { useGetMechanicList } from '@/components/Staff/staff-query'
import { formatRs } from '@/lib/format'
import { useTableState } from '@/hooks/useTableState'

// Leaflet is 160kB of its own. Loaded when this page is opened rather than
// bundled into the entry chunk, which is the same treatment the customer map
// gets — an eager import there once pushed the main bundle from 967 to 1147kB.
const DeliveryMap = lazy(() => import('@/components/Delivery/DeliveryMap'))

/**
 * Handing finished vehicles back.
 *
 * Two halves that answer different questions. The table is "what is outstanding
 * and who is dealing with it"; the map is "where is that van right now". They are
 * on one screen because an advisor taking a phone call needs both in the same
 * glance — the customer on the line is asking where their car is.
 */
export default function Deliveries() {
  const [status, setStatus] = useState<DeliveryStatus | typeof ALL>('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const statusParam = status === 'All' ? undefined : status

  const table = useTableState({ pageSize: 20 }, [statusParam])
  const { data, isFetching, isError } = useGetDeliveryListPaged(
    // `active: false` when a status is picked, so choosing "Delivered" is not
    // silently filtered back out by the API's default of live-only.
    table.toQuery({ status: statusParam, active: statusParam ? false : true }),
  )

  const rows = data?.list ?? []

  // Follow whatever is on the road, without waiting for a click. An advisor who
  // opens this screen while a van is out wants the map already showing it.
  const onTheRoad = useMemo(
    () => rows.find((d) => d.status === 'OutForDelivery') ?? null,
    [rows],
  )

  useEffect(() => {
    if (selectedId == null && onTheRoad) setSelectedId(onTheRoad.id)
  }, [onTheRoad, selectedId])

  // Dropping a selection that has left the list — a filter change, or a delivery
  // that finished — rather than polling an id no longer on screen.
  useEffect(() => {
    if (selectedId && rows.length > 0 && !rows.some((d) => d.id === selectedId)) {
      setSelectedId(null)
    }
  }, [rows, selectedId])

  const { data: track } = useGetDeliveryTrack(selectedId)

  const startDelivery = useStartDelivery()
  const completeDelivery = useCompleteDelivery()
  const { data: mechanics = [] } = useGetMechanicList()

  const busyId = startDelivery.isPending
    ? startDelivery.variables?.id
    : completeDelivery.isPending
      ? completeDelivery.variables
      : null

  const [driverPrompt, setDriverPrompt] = useState<IDelivery | null>(null)

  if (isError) return <ErrorBlock />

  const waiting = rows.filter((d) => d.status === 'AwaitingChoice').length
  const out = rows.filter((d) => d.status === 'OutForDelivery').length

  return (
    <div className="space-y-6">
      <StickyHeader title="Deliveries">
        <div className="flex items-center gap-2 text-xs">
          {waiting > 0 && <Badge tone="amber">{waiting} awaiting choice</Badge>}
          {out > 0 && <Badge tone="blue">{out} on the road</Badge>}
        </div>
      </StickyHeader>

      {selectedId && (
        <section className="card space-y-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink-900">
                {track ? `${track.delivery.vehiclePlate} → ${track.delivery.customerName}` : 'Loading…'}
              </h2>
              <p className="mt-0.5 text-xs text-ink-400">
                {track?.delivery.address || 'Following the driver'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {track && (
                <>
                  <span
                    className={`chip ${
                      isLive(track) ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isLive(track) ? 'bg-emerald-500' : 'bg-ink-400'
                      }`}
                    />
                    {freshness(track.secondsSinceUpdate)}
                  </span>
                  <Badge tone={statusTone[track.delivery.status]}>
                    {statusLabel[track.delivery.status]}
                  </Badge>
                </>
              )}
              <button type="button" className="btn-ghost text-xs" onClick={() => setSelectedId(null)}>
                Close map
              </button>
            </div>
          </div>

          {/* Said plainly, once, on the screen that could otherwise imply
              otherwise: a still marker is usually a closed app, not a parked
              van. */}
          <p className="text-xs text-ink-400">
            Positions arrive while the driver has the app open on the trip screen. A gap in the
            trail means they lost signal or closed the app — not that the vehicle stopped.
          </p>

          <Suspense
            fallback={
              <div className="flex h-[440px] items-center justify-center rounded-lg border border-ink-200">
                <Spinner />
              </div>
            }
          >
            {track ? (
              <DeliveryMap track={track} />
            ) : (
              <div className="flex h-[440px] items-center justify-center rounded-lg border border-ink-200">
                <Spinner />
              </div>
            )}
          </Suspense>

          {track && (
            <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <Fact label="Method" value={methodLabel[track.delivery.method]} />
              <Fact
                label="Distance"
                value={
                  track.delivery.distanceKm != null
                    ? `${track.delivery.distanceKm.toFixed(1)} km`
                    : '—'
                }
              />
              <Fact
                label="Fee"
                value={track.delivery.fee === 0 ? 'Free' : formatRs(track.delivery.fee)}
              />
              <Fact label="Driver" value={track.delivery.driver || 'Not assigned'} />
            </dl>
          )}
        </section>
      )}

      <div className="card overflow-hidden">
        {/* No search box: the API does not search handovers, and a field that
            silently does nothing is worse than no field. The filter sits where
            the filters sit on every other table. */}
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-4">
          <p className="text-xs text-ink-400">
            Outstanding handovers, newest first — anything on the road comes to the top.
          </p>
          <Dropdown
            className="w-full sm:w-48"
            placeholder="Live handovers"
            value={status === ALL ? null : status}
            onChange={(next) => setStatus((next as DeliveryStatus | null) ?? ALL)}
            options={DELIVERY_STATUSES.map((s) => ({ value: s, label: statusLabel[s] }))}
            isSearchable={false}
          />
        </div>

        <DeliveryTable
          data={rows}
          total={data?.count ?? 0}
          state={table.state}
          onStateChange={table.setState}
          loading={isFetching}
          selectedId={selectedId}
          busyId={busyId ?? null}
          onSelect={(d) => setSelectedId(d.id)}
          onStart={(d) => setDriverPrompt(d)}
          onComplete={(d) => completeDelivery.mutate(d.id)}
        />
      </div>

      {driverPrompt && (
        <DriverPicker
          delivery={driverPrompt}
          mechanics={mechanics}
          busy={startDelivery.isPending}
          onClose={() => setDriverPrompt(null)}
          onConfirm={async (driver) => {
            await startDelivery.mutateAsync({ id: driverPrompt.id, driver })
            setSelectedId(driverPrompt.id)
            setDriverPrompt(null)
          }}
        />
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-ink-50 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink-900">{value}</dd>
    </div>
  )
}

/**
 * Who is driving.
 *
 * Asked rather than assumed, because the answer is a name that goes on the
 * record and shows up in the customer's app. When a mechanic starts the run from
 * their own phone the API takes the driver from their token and ignores anything
 * sent here — this exists for the case where the front desk starts it for them.
 */
function DriverPicker({
  delivery,
  mechanics,
  busy,
  onClose,
  onConfirm,
}: {
  delivery: IDelivery
  mechanics: string[]
  busy: boolean
  onClose: () => void
  onConfirm: (driver: string) => void
}) {
  const [driver, setDriver] = useState(mechanics[0] ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="rounded-md bg-brand-50 p-2">
            <TruckIcon className="h-5 w-5 text-brand-600" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink-900">Start the run</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              {delivery.vehiclePlate} to {delivery.customerName}
              {delivery.distanceKm != null && ` · ${delivery.distanceKm.toFixed(1)} km`}
            </p>
          </div>
        </div>

        <label htmlFor="driver" className="mb-1.5 mt-4 block text-xs font-semibold text-ink-600">
          Who is driving?
        </label>
        {mechanics.length > 0 ? (
          <select
            id="driver"
            className="input"
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
          >
            {mechanics.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="driver"
            className="input"
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            placeholder="Name of the driver"
          />
        )}
        {mechanics.length === 0 && (
          <p className="mt-1 text-xs text-ink-400">
            No mechanic accounts yet — add them on the Staff screen so they can track the run from
            their phone.
          </p>
        )}

        <p className="mt-3 text-xs text-ink-400">
          Live tracking only works if the driver opens this delivery in the app. Started from here,
          the customer sees the handover but no moving pin until they do.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !driver.trim()}
            onClick={() => onConfirm(driver.trim())}
          >
            {busy && <Spinner />} Start
          </button>
        </div>
      </div>
    </div>
  )
}
