import type { IJobCard } from '@/components/JobCard/jobcard-schema'
import type { IInvoice } from '@/components/Invoice/invoice-schema'

// ── Report contract ──────────────────────────────────────────────────────────
// Reports have no endpoints of their own — there is no `report-api.ts` because
// there is no `/api/reports`. Everything is derived in the browser from the
// dashboard summary, job cards and invoices already fetched by their own
// features, so the aggregation lives here as pure functions the page can call
// and a test could cover.

/** A named total, ready to plot. */
export interface IReportSlice {
  name: string
  value: number
}

/** Brand colours for the payment rails, keyed by method name. */
export const METHOD_COLORS: Record<string, string> = {
  Cash: '#10b981',
  Card: '#2563eb',
  eSewa: '#22c55e',
  Khalti: '#8b5cf6',
  'Bank Transfer': '#f59e0b',
}

/** Sums `value` per key and returns the slices largest first. */
const groupAndSort = <T>(items: T[], keyOf: (item: T) => string | null, valueOf: (item: T) => number): IReportSlice[] => {
  const totals = new Map<string, number>()

  items.forEach((item) => {
    const key = keyOf(item)
    if (!key) return
    totals.set(key, (totals.get(key) ?? 0) + valueOf(item))
  })

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/** All-time job value per mechanic. */
export const revenueByMechanic = (jobs: IJobCard[]): IReportSlice[] =>
  groupAndSort(jobs, (job) => job.mechanic, (job) => job.total)

/** Amount actually collected per payment method. */
export const collectionsByMethod = (invoices: IInvoice[]): IReportSlice[] =>
  groupAndSort(invoices, (invoice) => invoice.method, (invoice) => invoice.paid)

/** Highest lifetime billed value. */
export const topCustomers = (invoices: IInvoice[], limit = 5): IReportSlice[] =>
  groupAndSort(invoices, (invoice) => invoice.customerName, (invoice) => invoice.total).slice(0, limit)

/** Mean invoice value; 0 when nothing has been billed. */
export const averageInvoiceValue = (invoices: IInvoice[]): number =>
  invoices.length ? invoices.reduce((sum, invoice) => sum + invoice.total, 0) / invoices.length : 0
