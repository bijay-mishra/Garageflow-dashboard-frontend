import SearchInput from '@/components/common/form/SearchInput'
import { FUEL_TYPES } from './vehicle-schema'

/** "All" plus every fuel type — the filter's full option set. */
export const FUEL_FILTERS = ['All', ...FUEL_TYPES] as const

export type FuelFilter = (typeof FUEL_FILTERS)[number]

interface VehicleFilterProps {
  search: string
  onSearchChange: (value: string) => void
  fuel: FuelFilter
  onFuelChange: (value: FuelFilter) => void
}

/** Search box + fuel-type pills above the vehicle table. */
export default function VehicleFilter({ search, onSearchChange, fuel, onFuelChange }: VehicleFilterProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput value={search} onChange={onSearchChange} placeholder="Search plate, make, owner…" />

      <div className="flex flex-wrap gap-1">
        {FUEL_FILTERS.map((option) => (
          <button
            key={option}
            onClick={() => onFuelChange(option)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              fuel === option ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
