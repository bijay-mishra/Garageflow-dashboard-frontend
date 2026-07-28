import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import { ErrorBlock } from '@/components/common/loaders/States'
import VehicleTable from '@/components/Vehicle/VehicleTable'
import VehicleForm from '@/components/Vehicle/VehicleForm'
import VehicleFilter, { type FuelFilter } from '@/components/Vehicle/VehicleFilter'
import {
  useDeleteVehicle,
  useFetchAllVehicles,
  useGetVehicleListPaged,
} from '@/components/Vehicle/vehicle-query'
import type { IVehicle } from '@/components/Vehicle/vehicle-schema'
import { useSearchQuery } from '@/hooks/useSearchQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'
import { downloadCSV } from '@/lib/csv'

export default function Vehicles() {
  const [query, setQuery] = useSearchQuery()
  const search = useDebouncedValue(query)
  const [fuel, setFuel] = useState<FuelFilter>('All')

  // "All" means send no fuel param at all.
  const fuelParam = fuel === 'All' ? undefined : fuel

  const table = useTableState({ pageSize: 20 }, [search, fuelParam])
  const { data, isFetching, isError } = useGetVehicleListPaged(table.toQuery({ search, fuel: fuelParam }))

  const deleteVehicle = useDeleteVehicle()
  const fetchAllVehicles = useFetchAllVehicles()
  const [modal, setModal] = useState<{ open: boolean; editing?: IVehicle }>({ open: false })

  const exportCsv = async () => {
    const rows = await fetchAllVehicles({ search, fuel: fuelParam })
    downloadCSV(
      'vehicles',
      ['ID', 'Plate', 'Make', 'Model', 'Year', 'Fuel', 'Odometer', 'Owner', 'Last service'],
      rows.map((v) => [v.id, v.plate, v.make, v.model, v.year, v.fuel, v.odometer, v.customerName, v.lastServiceDate ?? '']),
    )
  }

  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Vehicles">
        <button className="btn-ghost" onClick={exportCsv}>
          <ArrowDownTrayIcon className="h-4 w-4" /> Export
        </button>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          New vehicle
        </button>
      </StickyHeader>

      <div className="card overflow-hidden">
        <VehicleFilter search={query} onSearchChange={setQuery} fuel={fuel} onFuelChange={setFuel} />

        <VehicleTable
          data={data?.list ?? []}
          total={data?.count ?? 0}
          state={table.state}
          onStateChange={table.setState}
          loading={isFetching}
          onEdit={(vehicle) => setModal({ open: true, editing: vehicle })}
          onDelete={(vehicle) => deleteVehicle.mutate(vehicle.id)}
        />
      </div>

      {modal.open && <VehicleForm editing={modal.editing} onClose={() => setModal({ open: false })} />}
    </div>
  )
}
