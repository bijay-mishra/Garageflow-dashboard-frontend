import TableFilterBar from '@/components/common/table/TableFilterBar'
import FilterDropdown, { ALL } from '@/components/common/table/FilterDropdown'
import { FUEL_TYPES, VEHICLE_TYPES, type FuelType, type VehicleType } from './vehicle-schema'

/** A fuel type, or `All` for no fuel filter. */
export type FuelFilter = FuelType | typeof ALL

/** A body class, or `All` for no type filter. */
export type VehicleTypeFilter = VehicleType | typeof ALL

interface VehicleFilterProps {
  search: string
  onSearchChange: (value: string) => void
  type: VehicleTypeFilter
  onTypeChange: (value: VehicleTypeFilter) => void
  fuel: FuelFilter
  onFuelChange: (value: FuelFilter) => void
}

/** Search box plus body-class and fuel dropdowns above the vehicle table. */
export default function VehicleFilter({
  search,
  onSearchChange,
  type,
  onTypeChange,
  fuel,
  onFuelChange,
}: VehicleFilterProps) {
  return (
    <TableFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search plate, make, owner…"
    >
      <FilterDropdown placeholder="All types" options={VEHICLE_TYPES} value={type} onChange={onTypeChange} />
      <FilterDropdown placeholder="All fuels" options={FUEL_TYPES} value={fuel} onChange={onFuelChange} />
    </TableFilterBar>
  )
}
