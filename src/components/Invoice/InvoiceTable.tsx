import { useMemo } from 'react'
import { BanknotesIcon, PrinterIcon } from '@heroicons/react/24/outline'
import DataTable, { type Column, type ServerTableProps } from '@/components/common/table/DataTable'
import Badge, { type BadgeTone } from '@/components/common/Badge'
import { invoiceStatusTone } from '@/lib/status'
import { useDateFormat } from '@/hooks/useDateFormat'
import type { IInvoice, PaymentMethod } from './invoice-schema'

/**
 * Payment method → badge colour, grouped by channel rather than by brand.
 *
 * Cash reads green, the wallets share the blue end, bank and card sit in violet.
 * Someone scanning the column should see *how* the money arrived before they
 * read *which* service carried it.
 */
export const paymentMethodTone: Record<PaymentMethod, BadgeTone> = {
  Cash: 'green',
  eSewa: 'blue',
  Khalti: 'violet',
  Card: 'cyan',
  'Bank Transfer': 'gray',
}

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
  const { date, rs } = useDateFormat()

  const columns = useMemo<Column<IInvoice>[]>(
    () => [
      {
        key: 'id',
        header: 'Invoice',
        sortValue: (i) => i.id,
        render: (i) => <span className="font-semibold text-ink-900">{i.id}</span>,
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
        render: (i) => <span className="text-ink-500">{date(i.issuedAt)}</span>,
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right',
        sortValue: (i) => i.total,
        render: (i) => <span className="font-semibold text-ink-900">{rs(i.total)}</span>,
      },
      {
        key: 'due',
        header: 'Due',
        align: 'right',
        sortValue: (i) => i.due,
        render: (i) => (
          <span className="font-semibold text-rose-600">{i.due > 0 ? rs(i.due) : '—'}</span>
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
        key: 'method',
        header: 'Paid by',
        sortValue: (i) => i.method,
        // The method of the most recent payment. Blank until something is paid,
        // which is more honest than "—" implying cash.
        render: (i) =>
          i.method ? (
            <Badge tone={paymentMethodTone[i.method]}>{i.method}</Badge>
          ) : (
            <span className="text-xs text-ink-300">Not paid</span>
          ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (i) => (
          <div className="flex items-center justify-end gap-1.5">
            {i.due > 0 ? (
              <button onClick={() => onRecordPayment(i)} className="btn-soft px-3 py-1.5 text-xs">
                Record payment
              </button>
            ) : (
              <span className="text-xs text-ink-400">Settled</span>
            )}

            {/* Opens in a new tab and prints itself — see InvoicePrint. A link
                rather than a button so middle-click and "open in new window"
                behave the way anyone would expect of something that navigates. */}
            <a
              href={`/invoices/${i.id}/print?auto=1`}
              target="_blank"
              rel="noopener"
              aria-label={`Print invoice ${i.id}`}
              title="Print invoice"
              className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
            >
              <PrinterIcon className="h-4 w-4" />
            </a>
          </div>
        ),
      },
    ],
    [onRecordPayment, date, rs],
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
