import { lazy, Suspense, useState } from 'react'
import { ArrowDownTrayIcon, MapIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import StickyHeader from '@/components/common/headers/StickyHeader'
import TableFilterBar from '@/components/common/table/TableFilterBar'
import { ErrorBlock, Spinner } from '@/components/common/loaders/States'
import CustomerTable from '@/components/Customer/CustomerTable'
import CustomerForm from '@/components/Customer/CustomerForm'
import {
  useDeleteCustomer,
  useFetchAllCustomers,
  useGetCustomerList,
  useGetCustomerListPaged,
} from '@/components/Customer/customer-query'
import type { ICustomer } from '@/components/Customer/customer-schema'
import { useSearchQuery } from '@/hooks/useSearchQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'
import { downloadCSV } from '@/lib/csv'

// Leaflet and its stylesheet are ~150KB and only needed on the map tab, which
// most visits never open. Loading it lazily keeps the customer list as fast as
// it was before maps existed.
const CustomerMap = lazy(() => import('@/components/common/map/CustomerMap'))

export default function Customers() {
  const [query, setQuery] = useSearchQuery()
  const search = useDebouncedValue(query)
  const [view, setView] = useState<'table' | 'map'>('table')

  // Paging, sorting and search all run on the server; changing the search
  // returns to page 1.
  const table = useTableState({ pageSize: 20 }, [search])
  const { data, isFetching, isError } = useGetCustomerListPaged(table.toQuery({ search }))

  // The map wants every customer, not the twenty on this page — a map showing
  // page 1 of the pins would be quietly wrong. Only fetched once the map is
  // actually opened.
  const { data: allCustomers = [], isLoading: loadingMap } = useGetCustomerList(view === 'map')

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
        {/* Two views of the same records, so a segmented control rather than a
            separate page — the map is a lens on the customer list, not a
            different feature with its own place in the sidebar. */}
        <div className="flex items-center rounded-lg border border-ink-200 bg-white p-0.5">
          <ViewTab active={view === 'table'} onClick={() => setView('table')} icon={TableCellsIcon} label="List" />
          <ViewTab active={view === 'map'} onClick={() => setView('map')} icon={MapIcon} label="Map" />
        </div>

        <button className="btn-ghost" onClick={exportCsv}>
          <ArrowDownTrayIcon className="h-4 w-4" /> Export
        </button>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          New customer
        </button>
      </StickyHeader>

      {view === 'table' ? (
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
      ) : (
        <div className="card space-y-3 p-4">
          <PinnedCount customers={allCustomers} />

          {loadingMap ? (
            <div className="flex h-[420px] items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="flex h-[420px] items-center justify-center">
                  <Spinner />
                </div>
              }
            >
              <CustomerMap customers={allCustomers} />
            </Suspense>
          )}
        </div>
      )}

      {modal.open && <CustomerForm editing={modal.editing} onClose={() => setModal({ open: false })} />}
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof MapIcon
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition',
        active ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:text-ink-700',
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}

/**
 * Says how many customers the map is *not* showing.
 *
 * A map that silently omits everyone without a pin looks like a map of all your
 * customers, and a workshop would plan around it. Stating the gap is the whole
 * point of this line.
 */
function PinnedCount({ customers }: { customers: ICustomer[] }) {
  const pinned = customers.filter((c) => c.latitude != null && c.longitude != null).length
  const missing = customers.length - pinned

  return (
    <p className="text-xs text-ink-500">
      <b className="font-semibold text-ink-700">{pinned}</b> of {customers.length} customers pinned
      {missing > 0 && (
        <>
          {' · '}
          <span className="text-ink-400">
            {missing} without a location {missing === 1 ? 'is' : 'are'} not on the map
          </span>
        </>
      )}
    </p>
  )
}
