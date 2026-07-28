import TableFilterBar from '@/components/common/table/TableFilterBar'
import FilterDropdown, { ALL } from '@/components/common/table/FilterDropdown'
import { INVOICE_STATUSES, type InvoiceStatus } from './invoice-schema'

/** An invoice status, or `All` for no status filter. */
export type InvoiceStatusFilter = InvoiceStatus | typeof ALL

interface InvoiceFilterProps {
  search: string
  onSearchChange: (value: string) => void
  status: InvoiceStatusFilter
  onStatusChange: (value: InvoiceStatusFilter) => void
}

/** Search box plus a status dropdown above the invoice table. */
export default function InvoiceFilter({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: InvoiceFilterProps) {
  return (
    <TableFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search invoice, customer, plate…"
    >
      <FilterDropdown
        placeholder="All statuses"
        options={INVOICE_STATUSES}
        value={status}
        onChange={onStatusChange}
      />
    </TableFilterBar>
  )
}
