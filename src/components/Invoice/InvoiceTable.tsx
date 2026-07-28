import { useMemo } from 'react'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge from '@/components/common/Badge'
import { invoiceStatusTone } from '@/lib/status'
import { formatDate, formatRs } from '@/lib/format'
import type { IInvoice } from './invoice-schema'

interface InvoiceTableProps extends ServerTableProps {
  data: IInvoice[]
  onRecordPayment: (invoice: IInvoice) => void
}

/** Each column's `key` is sent to the API as `sortBy`, so it has to match a
 *  property on the server's InvoiceDto. */
export default function InvoiceTable({
  data,
  onRecordPayment,
  total,
  state,
  onStateChange,
  loading,
}: InvoiceTableProps) {
  const columns = useMemo<Column<IInvoice>[]>(
    () => [
      {
        key: 'id',
        header: 'Invoice',
        sortValue: (i) => i.id,
        render: (i) => (
          <>
            <p className="font-semibold text-ink-900">{i.id}</p>
            <p className="text-xs text-ink-400">{i.vehiclePlate}</p>
          </>
        ),
      },
      {
        key: 'customerName',
        header: 'Customer',
        sortValue: (i) => i.customerName,
        render: (i) => <span className="text-ink-700">{i.customerName}</span>,
      },
      {
        key: 'issuedAt',
        header: 'Date',
        sortValue: (i) => i.issuedAt,
        render: (i) => <span className="text-ink-500">{formatDate(i.issuedAt)}</span>,
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right',
        sortValue: (i) => i.total,
        render: (i) => <span className="font-semibold text-ink-900">{formatRs(i.total)}</span>,
      },
      {
        key: 'due',
        header: 'Due',
        align: 'right',
        sortValue: (i) => i.due,
        render: (i) => (
          <span className="font-semibold text-rose-600">{i.due > 0 ? formatRs(i.due) : '—'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortValue: (i) => i.status,
        render: (i) => (
          <Badge tone={invoiceStatusTone(i.status)} dot>
            {i.status}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (i) =>
          i.due > 0 ? (
            <button onClick={() => onRecordPayment(i)} className="btn-soft px-3 py-1.5 text-xs">
              Record payment
            </button>
          ) : (
            <span className="text-xs text-ink-400">Settled</span>
          ),
      },
    ],
    [onRecordPayment],
  )

  return (
    <DataTable
      serverMode
      columns={columns}
      data={data}
      rowKey={(i) => i.id}
      itemLabel="invoices"
      total={total}
      state={state}
      onStateChange={onStateChange}
      loading={loading}
      empty={{
        icon: BanknotesIcon,
        title: 'No invoices found',
        message: 'Create an invoice from a completed job card.',
      }}
    />
  )
}
