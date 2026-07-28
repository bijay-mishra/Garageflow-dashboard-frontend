import * as Yup from 'yup'
import { todayISO } from '@/lib/format'

// ── Job card contract ────────────────────────────────────────────────────────
// These vocabularies mirror `Vocabulary.JobStatuses` / `JobPriorities` on the
// .NET side, and their order drives the dashboard's status breakdown — keep the
// two in step.

export const JOB_STATUSES = [
  'Open',
  'In Progress',
  'Awaiting Parts',
  'Completed',
  'Delivered',
  'Cancelled',
] as const

export const JOB_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const

export const JOB_LINE_KINDS = ['labour', 'part'] as const

export type JobStatus = (typeof JOB_STATUSES)[number]
export type JobPriority = (typeof JOB_PRIORITIES)[number]
export type JobLineKind = (typeof JOB_LINE_KINDS)[number]

/** Statuses shown as columns on the board view — the work still in the shop. */
export const BOARD_STATUSES: JobStatus[] = ['Open', 'In Progress', 'Awaiting Parts', 'Completed']

/**
 * Mechanics available for assignment. Hardcoded until the API grows a staff
 * endpoint; the API accepts any string, so this list only shapes the dropdown.
 */
export const MECHANICS = ['Suresh Lama', 'Kiran Adhikari', 'Ramesh Bhandari', 'Dipesh Shakya']

export interface IJobLine {
  description: string
  /** Hours for labour, units for parts. */
  qty: number
  unitPrice: number
  kind: JobLineKind
}

/** A job card as `GET /api/job-cards` returns it. */
export interface IJobCard {
  id: string
  vehicleId: string
  vehiclePlate: string
  /** "Toyota Corolla 2019" — denormalised server-side. */
  vehicleLabel: string
  customerId: string
  customerName: string
  complaint: string
  status: JobStatus
  priority: JobPriority
  mechanic: string
  odometer: number
  createdAt: string
  promisedAt: string
  /** Stamped by the server when the job reaches Completed or Delivered. */
  completedAt: string | null
  lines: IJobLine[]
  /** Sum of all lines — computed server-side; never send it. */
  total: number
}

export const jobLineSchema = Yup.object({
  description: Yup.string().trim().required('Description is required').max(300, 'Description is too long'),
  qty: Yup.number()
    .typeError('Qty must be a number')
    .required('Qty is required')
    .moreThan(0, 'Qty must be greater than 0'),
  unitPrice: Yup.number()
    .typeError('Price must be a number')
    .required('Price is required')
    .min(0, 'Price cannot be negative'),
  kind: Yup.string().oneOf(JOB_LINE_KINDS).required(),
})

export const jobCardFormSchema = Yup.object({
  vehicleId: Yup.string().required('Vehicle is required'),
  complaint: Yup.string().trim().required('Complaint is required').max(1000, 'Complaint is too long'),
  status: Yup.string().oneOf(JOB_STATUSES).required(),
  priority: Yup.string().oneOf(JOB_PRIORITIES).required(),
  mechanic: Yup.string().trim().max(120, 'Name is too long').default(''),
  odometer: Yup.number()
    .typeError('Odometer must be a number')
    .required('Odometer is required')
    .integer('Odometer must be a whole number')
    .min(0, 'Odometer cannot be negative'),
  promisedAt: Yup.string().required('Promised date is required'),
  // A job can be opened before anyone knows what it needs, so an empty list is
  // valid — but a line that exists has to be filled in.
  lines: Yup.array().of(jobLineSchema).default([]),
})

export type JobCardFormType = Yup.InferType<typeof jobCardFormSchema>

/** A fresh, blank parts/labour row. */
export const emptyJobLine: IJobLine = { description: '', qty: 1, unitPrice: 0, kind: 'labour' }

export const jobCardInitialValues: JobCardFormType = {
  vehicleId: '',
  complaint: '',
  status: 'Open',
  priority: 'Normal',
  mechanic: MECHANICS[0],
  odometer: 0,
  promisedAt: todayISO(),
  lines: [{ ...emptyJobLine }],
}

export const toJobCardFormValues = (job?: IJobCard): JobCardFormType =>
  job
    ? {
        vehicleId: job.vehicleId,
        complaint: job.complaint,
        status: job.status,
        priority: job.priority,
        mechanic: job.mechanic,
        odometer: job.odometer,
        promisedAt: job.promisedAt,
        lines: job.lines.length ? job.lines.map((line) => ({ ...line })) : [],
      }
    : jobCardInitialValues

/** Sum of every line — mirrors `JobCard.Total` on the server. */
export const jobLinesTotal = (lines: Pick<IJobLine, 'qty' | 'unitPrice'>[]): number =>
  lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * (Number(line.unitPrice) || 0), 0)
