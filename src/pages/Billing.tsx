import { useState } from 'react'
import { ArrowDownTrayIcon, BanknotesIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import StatCard from '@/components/common/StatCard'
import { ErrorBlock } from '@/components/common/loaders/States'
import InvoiceTable from '@/components/Invoice/InvoiceTable'
import InvoiceForm from '@/components/Invoice/InvoiceForm'
import PaymentForm from '@/components/Invoice/PaymentForm'
import InvoiceFilter, { type InvoiceStatusFilter } from '@/components/Invoice/InvoiceFilter'
import {
  useFetchAllInvoices,
  useGetInvoiceListPaged,
  useGetInvoiceSummary,
} from '@/components/Invoice/invoice-query'
import type { IInvoice } from '@/components/Invoice/invoice-schema'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'
import { formatRsCompact } from '@/lib/format'
import { downloadCSV } from '@/lib/csv'

export default function Billing() {
  const [query, setQuery] = useState('')
  const search = useDebouncedValue(query)
  const [status, setStatus] = useState<InvoiceStatusFilter>('All')

  // "All" means send no status param at all.
  const statusParam = status === 'All' ? undefined : status

  const table = useTableState({ pageSize: 20 }, [search, statusParam])
  const { data, isFetching, isError } = useGetInvoiceListPaged(
    table.toQuery({ search, status: statusParam }),
  )

  // All-time totals, so the cards do not change as you page through the table.
  const { data: summary } = useGetInvoiceSummary()

  const fetchAllInvoices = useFetchAllInvoices()
  const [createOpen, setCreateOpen] = useState(false)
  const [payFor, setPayFor] = useState<IInvoice | null>(null)

  const exportCsv = async () => {
    const rows = await fetchAllInvoices({ search, status: statusParam })
    downloadCSV(
      'invoices',
      ['ID', 'Date', 'Customer', 'Plate', 'Subtotal', 'Tax', 'Total', 'Paid', 'Due', 'Status', 'Method'],
      rows.map((i) => [i.id, i.issuedAt, i.customerName, i.vehiclePlate, i.subtotal, i.tax, i.total, i.paid, i.due, i.status, i.method ?? '']),
    )
  }

  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Billing">
        <button className="btn-ghost" onClick={exportCsv}>
          <ArrowDownTrayIcon className="h-4 w-4" /> Export
        </button>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          New invoice
        </button>
      </StickyHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatRsCompact(summary?.billed ?? 0)} icon={BanknotesIcon} tone="brand" />
        <StatCard label="Collected" value={formatRsCompact(summary?.collected ?? 0)} icon={CheckCircleIcon} tone="emerald" />
        <StatCard label="Outstanding" value={formatRsCompact(summary?.outstanding ?? 0)} icon={ClockIcon} tone="rose" />
      </div>

      <div className="card overflow-hidden">
        <InvoiceFilter search={query} onSearchChange={setQuery} status={status} onStatusChange={setStatus} />

        <InvoiceTable
          data={data?.list ?? []}
          total={data?.count ?? 0}
          state={table.state}
          onStateChange={table.setState}
          loading={isFetching}
          onRecordPayment={setPayFor}
        />
      </div>

      {createOpen && <InvoiceForm onClose={() => setCreateOpen(false)} />}
      {payFor && <PaymentForm invoice={payFor} onClose={() => setPayFor(null)} />}
    </div>
  )
}
