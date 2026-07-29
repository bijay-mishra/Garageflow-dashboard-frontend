import TableFilterBar from '@/components/common/table/TableFilterBar'
import FilterDropdown, { ALL } from '@/components/common/table/FilterDropdown'
import { VEHICLE_TYPES, type VehicleType } from '@/components/Vehicle/vehicle-schema'
import { SERVICE_CATEGORIES, type ServiceCategory } from './service-schema'

/** A category, or `All` for no category filter. */
export type ServiceCategoryFilter = ServiceCategory | typeof ALL

/** A body class, or `All` for every vehicle. */
export type ServiceVehicleFilter = VehicleType | typeof ALL

interface ServiceFilterProps {
  search: string
  onSearchChange: (value: string) => void
  category: ServiceCategoryFilter
  onCategoryChange: (value: ServiceCategoryFilter) => void
  vehicleType: ServiceVehicleFilter
  onVehicleTypeChange: (value: ServiceVehicleFilter) => void
}

/**
 * Search box plus category and vehicle-type dropdowns above the price list.
 *
 * The vehicle filter answers the question the counter actually asks — "what can
 * I offer this bike?" — and includes services with no restriction, since those
 * apply to everything.
 */
export default function ServiceFilter({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  vehicleType,
  onVehicleTypeChange,
}: ServiceFilterProps) {
  return (
    <TableFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search service, description…"
    >
      <FilterDropdown
        placeholder="All categories"
        options={SERVICE_CATEGORIES}
        value={category}
        onChange={onCategoryChange}
        className="w-full sm:w-44"
      />
      <FilterDropdown
        placeholder="All vehicles"
        options={VEHICLE_TYPES}
        value={vehicleType}
        onChange={onVehicleTypeChange}
      />
    </TableFilterBar>
  )
}
