import SearchInput from '@/components/common/form/SearchInput'
import { INVOICE_STATUSES } from './invoice-schema'

export const INVOICE_STATUS_FILTERS = ['All', ...INVOICE_STATUSES] as const

export type InvoiceStatusFilter = (typeof INVOICE_STATUS_FILTERS)[number]

interface InvoiceFilterProps {
  search: string
  onSearchChange: (value: string) => void
  status: InvoiceStatusFilter
  onStatusChange: (value: InvoiceStatusFilter) => void
}

/** Search box + status pills above the invoice table. */
export default function InvoiceFilter({ search, onSearchChange, status, onStatusChange }: InvoiceFilterProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput value={search} onChange={onSearchChange} placeholder="Search invoice, customer, plate…" />

      <div className="flex flex-wrap gap-1">
        {INVOICE_STATUS_FILTERS.map((option) => (
          <button
            key={option}
            onClick={() => onStatusChange(option)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              status === option ? 'bg-brand-600 text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
