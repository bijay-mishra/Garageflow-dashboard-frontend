import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import TableFilterBar from '@/components/common/table/TableFilterBar'
import { ErrorBlock } from '@/components/common/loaders/States'
import CustomerTable from '@/components/Customer/CustomerTable'
import CustomerForm from '@/components/Customer/CustomerForm'
import {
  useDeleteCustomer,
  useFetchAllCustomers,
  useGetCustomerListPaged,
} from '@/components/Customer/customer-query'
import type { ICustomer } from '@/components/Customer/customer-schema'
import { useSearchQuery } from '@/hooks/useSearchQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'
import { downloadCSV } from '@/lib/csv'

export default function Customers() {
  const [query, setQuery] = useSearchQuery()
  const search = useDebouncedValue(query)

  // Paging, sorting and search all run on the server; changing the search
  // returns to page 1.
  const table = useTableState({ pageSize: 20 }, [search])
  const { data, isFetching, isError } = useGetCustomerListPaged(table.toQuery({ search }))

  const deleteCustomer = useDeleteCustomer()
  const fetchAllCustomers = useFetchAllCustomers()
  const [modal, setModal] = useState<{ open: boolean; editing?: ICustomer }>({ open: false })

  // Exports every row matching the search, not just the page on screen.
  const exportCsv = async () => {
    const rows = await fetchAllCustomers({ search })
    downloadCSV(
      'customers',
      ['ID', 'Name', 'Phone', 'Email', 'Address', 'Vehicles', 'Total spent', 'Since'],
      rows.map((c) => [c.id, c.name, c.phone, c.email, c.address, c.vehicleCount, c.totalSpent, c.createdAt]),
    )
  }

  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Customers">
        <button className="btn-ghost" onClick={exportCsv}>
          <ArrowDownTrayIcon className="h-4 w-4" /> Export
        </button>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          New customer
        </button>
      </StickyHeader>

      <div className="card overflow-hidden">
        {/* No server-side filters on customers yet — the bar is shared so the
            search box lands in the same spot as on every other list page. */}
        <TableFilterBar
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search name, phone, email…"
        />

        <CustomerTable
          data={data?.list ?? []}
          total={data?.count ?? 0}
          state={table.state}
          onStateChange={table.setState}
          loading={isFetching}
          onEdit={(customer) => setModal({ open: true, editing: customer })}
          onDelete={(customer) => deleteCustomer.mutate(customer.id)}
        />
      </div>

      {modal.open && <CustomerForm editing={modal.editing} onClose={() => setModal({ open: false })} />}
    </div>
  )
}
