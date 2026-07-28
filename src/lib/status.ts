import type { BadgeTone } from '@/components/common/Badge'
import type { JobPriority, JobStatus } from '@/components/JobCard/jobcard-schema'
import type { InvoiceStatus } from '@/components/Invoice/invoice-schema'

// Presentation only — how a status looks. The vocabularies themselves live with
// their feature: JOB_STATUSES in JobCard/jobcard-schema.ts, INVOICE_STATUSES in
// Invoice/invoice-schema.ts.

export function jobStatusTone(status: JobStatus): BadgeTone {
  switch (status) {
    case 'Delivered':
    case 'Completed':
      return 'green'
    case 'In Progress':
      return 'blue'
    case 'Awaiting Parts':
      return 'amber'
    case 'Open':
      return 'violet'
    case 'Cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

export function priorityTone(p: JobPriority): BadgeTone {
  switch (p) {
    case 'Urgent':
      return 'red'
    case 'High':
      return 'amber'
    case 'Normal':
      return 'blue'
    case 'Low':
      return 'gray'
    default:
      return 'gray'
  }
}

export function invoiceStatusTone(status: InvoiceStatus): BadgeTone {
  switch (status) {
    case 'Paid':
      return 'green'
    case 'Partial':
      return 'amber'
    case 'Unpaid':
      return 'red'
    case 'Refunded':
      return 'gray'
    default:
      return 'gray'
  }
}

/** Colour used in Recharts for each job status (raw hex — charts can't use classes). */
export const jobStatusColor: Record<JobStatus, string> = {
  Open: '#8b5cf6',
  'In Progress': '#2563eb',
  'Awaiting Parts': '#f59e0b',
  Completed: '#10b981',
  Delivered: '#0ea5e9',
  Cancelled: '#f43f5e',
}
