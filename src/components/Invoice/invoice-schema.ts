import * as Yup from 'yup'

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

/** One receipt against an invoice, from `GET /api/invoices/{id}/payments`. */
export interface IPayment {
  id: number
  amount: number
  method: PaymentMethod
  at: string
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
  })

export type PaymentFormType = {
  amount: number
  method: PaymentMethod
}

/** VAT and total for a subtotal, matching the server's rounding exactly. */
export const calculateInvoiceTotals = (subtotal: number, taxRate: number) => {
  const tax = Math.round(subtotal * taxRate * 100) / 100
  return { subtotal, tax, total: subtotal + tax }
}
