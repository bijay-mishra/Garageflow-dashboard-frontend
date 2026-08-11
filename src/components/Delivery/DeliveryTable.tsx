import { useMemo } from 'react'
import { TruckIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge from '@/components/common/Badge'
import { formatAmount } from '@/lib/format'
import {
  methodLabel,
  statusLabel,
  statusTone,
  type IDelivery,
} from './delivery-schema'

interface DeliveryTableProps extends ServerTableProps {
  data: IDelivery[]
  /** The row currently on the map. */
  selectedId: string | null
  onSelect: (delivery: IDelivery) => void
  onStart: (delivery: IDelivery) => void
  onComplete: (delivery: IDelivery) => void
  busyId?: string | null
}

export default function DeliveryTable({
  data,
  selectedId,
  onSelect,
  onStart,
  onComplete,
  busyId,
  total,
  state,
  onStateChange,
  loading,
}: DeliveryTableProps) {
  const columns = useMemo<Column<IDelivery>[]>(
    () => [
      {
        key: 'vehiclePlate',
        header: 'Vehicle',
        sortValue: (d) => d.vehiclePlate,
        // One line. The plate identifies the car and the label qualifies it;
        // stacking them put a grey second line under every row on every table
        // in this product, which is what the single-line rule removed.
        render: (d) => (
          <span className="font-semibold text-ink-900">
            {d.vehiclePlate}
            <span className="ml-2 font-normal text-ink-400">{d.vehicleLabel}</span>
          </span>
        ),
      },
      {
        key: 'customerName',
        header: 'Customer',
        sortValue: (d) => d.customerName,
        render: (d) => <span className="text-ink-700">{d.customerName}</span>,
      },
      {
        key: 'method',
        header: 'Method',
        sortValue: (d) => d.method,
        render: (d) => (
          <span className="text-ink-600">
            {methodLabel[d.method]}
            {d.method === 'HomeDelivery' && d.distanceKm != null && (
              <span className="ml-2 text-xs text-ink-400">{d.distanceKm.toFixed(1)} km</span>
            )}
          </span>
        ),
      },
      {
        key: 'fee',
        header: 'Fee',
        align: 'right',
        sortValue: (d) => d.fee,
        render: (d) =>
          d.method === 'Pickup' ? (
            <span className="text-ink-300">—</span>
          ) : d.fee === 0 ? (
            <span className="text-xs font-semibold text-emerald-600">Free</span>
          ) : (
            <span className="font-semibold text-ink-900">{formatAmount(d.fee)}</span>
          ),
      },
      {
        key: 'driver',
        header: 'Driver',
        sortValue: (d) => d.driver,
        render: (d) =>
          d.driver ? (
            <span className="text-ink-700">{d.driver}</span>
          ) : (
            <span className="text-ink-300">—</span>
          ),
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (d) => d.status,
        render: (d) => <Badge tone={statusTone[d.status]}>{statusLabel[d.status]}</Badge>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (d) => {
          const busy = busyId === d.id

          return (
            <div className="flex items-center justify-end gap-2">
              {d.method === 'HomeDelivery' && (
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => onSelect(d)}
                  disabled={selectedId === d.id}
                >
                  {selectedId === d.id ? 'On map' : 'Track'}
                </button>
              )}

              {/* Nothing for staff to do until the customer has chosen: there is
                  no run to start and nothing to hand over. */}
              {d.status === 'Scheduled' && d.method === 'HomeDelivery' && (
                <button
                  type="button"
                  className="btn-soft text-xs"
                  onClick={() => onStart(d)}
                  disabled={busy}
                >
                  Start run
                </button>
              )}

              {(d.status === 'Scheduled' || d.status === 'OutForDelivery') && (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => onComplete(d)}
                  disabled={busy}
                >
                  {d.method === 'Pickup' ? 'Collected' : 'Delivered'}
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [busyId, onComplete, onSelect, onStart, selectedId],
  )

  return (
    <DataTable
      serverMode
      columns={columns}
      data={data}
      rowKey={(d) => d.id}
      itemLabel="handovers"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{
        icon: TruckIcon,
        title: 'Nothing waiting to go out',
        message:
          'A handover appears here when a job is completed. The customer then says whether they are collecting it or would like it delivered.',
      }}
    />
  )
}
