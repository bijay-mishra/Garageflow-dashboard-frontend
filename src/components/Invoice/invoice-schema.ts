import * as Yup from 'yup'
import type { IJobLine } from '@/components/JobCard/jobcard-schema'

// ── Invoice contract ─────────────────────────────────────────────────────────
// Mirrors `Vocabulary.InvoiceStatuses` / `PaymentMethods` on the .NET side.
// Tax, total and status are always computed by the server — the client sends a
// subtotal and a rate and reads the rest back.

export const INVOICE_STATUSES = ['Paid', 'Partial', 'Unpaid', 'Refunded'] as const

export const PAYMENT_METHODS = ['Cash', 'Card', 'eSewa', 'Khalti', 'Bank Transfer'] as const

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** An invoice as `GET /api/invoices` returns it. */
export interface IInvoice {
  id: string
  jobCardId: string
  customerId: string
  /** Snapshotted at issue time — renaming the customer will not rewrite it. */
  customerName: string
  vehiclePlate: string
  issuedAt: string
  subtotal: number
  /** Fractional rate, e.g. 0.13 for 13% VAT. */
  taxRate: number
  tax: number
  total: number
  paid: number
  /** Outstanding balance — computed server-side so the list can sort on it. */
  due: number
  status: InvoiceStatus
  method: PaymentMethod | null
}

/** Billing totals from `GET /api/invoices/summary`. */
export interface IInvoiceSummary {
  billed: number
  collected: number
  outstanding: number
}

/**
 * How the money moved, as opposed to whose brand carried it.
 *
 * The distinction that matters at close of day: `cash` is in the drawer and has
 * to be counted, `online` and `bank` are somebody else's ledger and have to be
 * reconciled. Three buckets survive a new wallet appearing; a list of brand
 * names does not.
 */
export const PAYMENT_CHANNELS = ['cash', 'online', 'bank'] as const

export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number]

/** Where a payment attempt stands. Only `Completed` is money. */
export const PAYMENT_STATUSES = ['Pending', 'Completed', 'Failed', 'Cancelled'] as const

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

/** One receipt against an invoice, from `GET /api/invoices/{id}/payments`. */
export interface IPayment {
  id: number
  amount: number
  method: PaymentMethod
  channel: PaymentChannel
  /** A Pending row is an attempt, not a receipt — it holds no money. */
  status: PaymentStatus
  /** Our id for the attempt, or the slip number staff typed in. */
  reference: string | null
  /** The gateway's own transaction id. Null for anything recorded by hand. */
  providerRef: string | null
  failureReason: string | null
  at: string
}

/** What came in through each channel — from `GET /api/invoices/collections`. */
export interface ICollections {
  cash: number
  online: number
  bank: number
  total: number
  /** Attempts still open. A count, never an amount — nobody has paid yet. */
  pendingCount: number
}

/** Channel → how it reads in the UI. */
export const channelLabel: Record<PaymentChannel, string> = {
  cash: 'Cash',
  online: 'Online',
  bank: 'Bank / card',
}

/**
 * Everything the printed bill needs, from `GET /api/invoices/{id}/print`.
 *
 * Composed by the server in one request. `hasJobCard` is false when the job this
 * was raised for has since been deleted — the invoice still prints, with its own
 * totals, but there is no itemised breakdown to show.
 */
export interface IInvoicePrint {
  invoice: IInvoice
  payments: IPayment[]
  customerAddress: string
  customerPhone: string
  customerEmail: string
  vehicleLabel: string
  odometer: number
  complaint: string
  mechanic: string
  completedAt: string | null
  lines: IJobLine[]
  hasJobCard: boolean
}

// ── Create invoice ───────────────────────────────────────────────────────────

export const invoiceFormSchema = Yup.object({
  jobCardId: Yup.string().required('Select a job card to bill'),
  taxRate: Yup.number()
    .typeError('VAT must be a number')
    .required('VAT rate is required')
    .min(0, 'VAT cannot be negative')
    .max(1, 'VAT rate is a fraction, e.g. 0.13'),
  paid: Yup.number()
    .typeError('Amount must be a number')
    .required('Amount is required')
    .min(0, 'Amount cannot be negative'),
  method: Yup.string().oneOf(PAYMENT_METHODS).required(),
})

export type InvoiceFormType = Yup.InferType<typeof invoiceFormSchema>

/** @param defaultTaxRate the workshop's standard VAT rate. */
export const invoiceInitialValues = (defaultTaxRate: number): InvoiceFormType => ({
  jobCardId: '',
  taxRate: defaultTaxRate,
  paid: 0,
  method: 'Cash',
})

/**
 * Body for `POST /api/invoices`. Wider than the form: the customer and plate
 * come from the selected job card rather than from user input. The server
 * re-derives both anyway and ignores what is sent, but they are part of the
 * documented contract.
 */
export interface IAddInvoiceRequest {
  jobCardId: string
  customerId: string
  customerName: string
  vehiclePlate: string
  issuedAt: string
  subtotal: number
  taxRate: number
  paid: number
  method: PaymentMethod | null
}

// ── Record payment ───────────────────────────────────────────────────────────

/** @param due the outstanding balance — a payment cannot exceed it. */
export const paymentFormSchema = (due: number) =>
  Yup.object({
    amount: Yup.number()
      .typeError('Amount must be a number')
      .required('Amount is required')
      .moreThan(0, 'Amount must be greater than 0')
      .max(due, `Amount cannot exceed the ${due.toFixed(2)} due`),
    method: Yup.string().oneOf(PAYMENT_METHODS).required(),
    reference: Yup.string().trim().max(120, 'Reference is too long').default(''),
  })

export type PaymentFormType = {
  amount: number
  method: PaymentMethod
  /**
   * Bank slip or wallet transaction id, typed by whoever took the payment.
   *
   * Optional, and the only thing that makes a manually recorded transfer
   * reconcilable against a statement later. Cash has none, so the field is
   * hidden for it rather than sitting empty.
   */
  reference?: string
}

/** VAT and total for a subtotal, matching the server's rounding exactly. */
export const calculateInvoiceTotals = (subtotal: number, taxRate: number) => {
  const tax = Math.round(subtotal * taxRate * 100) / 100
  return { subtotal, tax, total: subtotal + tax }
}
