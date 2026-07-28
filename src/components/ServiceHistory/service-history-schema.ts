import { type IJobCard } from '@/components/JobCard/jobcard-schema'

// ── Service history contract ─────────────────────────────────────────────────
// No endpoints of its own: service history is finished job cards, so it reads
// through `jobcard-query.ts`. Only the selection rule lives here.

/** Statuses that count as "serviced" — work the customer actually received. */
const HISTORY_STATUSES = ['Completed', 'Delivered']

/**
 * Finished jobs matching the search term, most recently completed first.
 * Searches job id, vehicle label, plate and customer name.
 */
export const filterServiceHistory = (jobs: IJobCard[], search: string): IJobCard[] => {
  const q = search.trim().toLowerCase()

  return jobs
    .filter((job) => HISTORY_STATUSES.includes(job.status))
    .filter(
      (job) =>
        !q ||
        job.vehicleLabel.toLowerCase().includes(q) ||
        job.vehiclePlate.toLowerCase().includes(q) ||
        job.customerName.toLowerCase().includes(q) ||
        job.id.toLowerCase().includes(q),
    )
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
}
