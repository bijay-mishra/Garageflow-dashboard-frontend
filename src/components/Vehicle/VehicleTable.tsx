import { useMemo } from 'react'
import { TruckIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge, { type BadgeTone } from '@/components/common/Badge'
import EntityActions from '@/components/common/buttons/EntityActions'
import { formatDate, formatNumber } from '@/lib/format'
import type { FuelType, IVehicle, VehicleType } from './vehicle-schema'

/** Fuel type → badge colour. Electric reads green, diesel stays neutral. */
export const fuelTone: Record<FuelType, BadgeTone> = {
  Petrol: 'blue',
  Diesel: 'gray',
  Electric: 'green',
  Hybrid: 'violet',
  CNG: 'amber',
}

/** Body class → badge colour. The heavy categories share a warmer end of the
 *  palette so a bus or truck stands out from the light vehicles at a glance. */
export const vehicleTypeTone: Record<VehicleType, BadgeTone> = {
  Bike: 'violet',
  Car: 'blue',
  Van: 'green',
  Bus: 'amber',
  Truck: 'amber',
  Tractor: 'gray',
}

interface VehicleTableProps extends ServerTableProps {
  data: IVehicle[]
  onEdit: (vehicle: IVehicle) => void
  onDelete: (vehicle: IVehicle) => void
}

/** Each column's `key` is sent to the API as `sortBy`, so it has to match a
 *  property on the server's VehicleDto. */
export default function VehicleTable({
  data,
  onEdit,
  onDelete,
  total,
  state,
  onStateChange,
  loading,
}: VehicleTableProps) {
  const columns = useMemo<Column<IVehicle>[]>(
    () => [
      {
        // Sorts by make — the server has no combined make+model column.
        key: 'make',
        header: 'Vehicle',
        sortValue: (v) => `${v.make} ${v.model}`,
        // One line. The year is folded in rather than dropped — it is how you
        // tell two otherwise identical cars apart — and the colour goes, since
        // the plate below already identifies the vehicle uniquely.
        render: (v) => (
          <span className="font-semibold text-ink-900">
            {v.make} {v.model} {v.year}
          </span>
        ),
      },
      {
        key: 'plate',
        header: 'Plate',
        sortValue: (v) => v.plate,
        render: (v) => (
          <span className="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-xs font-semibold text-ink-700">
            {v.plate}
          </span>
        ),
      },
      {
        key: 'customerName',
        header: 'Owner',
        sortValue: (v) => v.customerName,
        render: (v) => <span className="text-ink-700">{v.customerName}</span>,
      },
      {
        key: 'type',
        header: 'Type',
        sortValue: (v) => v.type,
        render: (v) => <Badge tone={vehicleTypeTone[v.type]}>{v.type}</Badge>,
      },
      {
        key: 'fuel',
        header: 'Fuel',
        sortValue: (v) => v.fuel,
        render: (v) => <Badge tone={fuelTone[v.fuel]}>{v.fuel}</Badge>,
      },
      {
        key: 'odometer',
        header: 'Odometer',
        align: 'right',
        sortValue: (v) => v.odometer,
        render: (v) => <span className="font-semibold text-ink-700">{formatNumber(v.odometer)} km</span>,
      },
      {
        key: 'lastServiceDate',
        header: 'Last service',
        sortValue: (v) => v.lastServiceDate,
        render: (v) => <span className="text-ink-500">{formatDate(v.lastServiceDate)}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (v) => (
          <EntityActions
            label={`${v.make} ${v.model} (${v.plate})`}
            onEdit={() => onEdit(v)}
            onDelete={() => onDelete(v)}
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
      rowKey={(v) => v.id}
      itemLabel="vehicles"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{ icon: TruckIcon, title: 'No vehicles found', message: 'Adjust filters or register a new vehicle.' }}
    />
  )
}
