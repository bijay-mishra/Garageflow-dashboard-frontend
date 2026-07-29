import * as Yup from 'yup'
import { VEHICLE_TYPES, type VehicleType } from '@/components/Vehicle/vehicle-schema'

// ── Service catalogue contract ───────────────────────────────────────────────
// The workshop's price list: washing, detailing, alignment, pickup and drop.
// Picking one puts a priced line on a job card — see `emptyJobLine` and the
// service picker in the job card form.
//
// `SERVICE_CATEGORIES` mirrors `Vocabulary.ServiceCategories` on the .NET side
// and the API rejects anything else, so the two have to move together.

export const SERVICE_CATEGORIES = [
  'Washing',
  'Detailing',
  'Maintenance',
  'Repair',
  'Inspection',
  'Convenience',
  'Other',
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

/** A service as `GET /api/services` returns it. */
export interface IService {
  id: string
  name: string
  description: string
  category: ServiceCategory
  price: number
  /** Rough bay time. 0 means the shop does not quote one. */
  durationMinutes: number
  isActive: boolean
  /** False for extras the shop adds itself and customers cannot order. */
  isBookable: boolean
  /**
   * Body classes this is offered for. An empty array means every vehicle —
   * which is right for an AC regas and wrong for a wash, since washing a bus is
   * not the job that washing a scooter is.
   */
  appliesTo: VehicleType[]
  /** How many job cards have carried it. Non-zero means retire, don't delete. */
  timesUsed: number
}

export const serviceFormSchema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(160, 'Name is too long'),
  description: Yup.string().trim().max(500, 'Description is too long').default(''),
  category: Yup.string().oneOf(SERVICE_CATEGORIES, 'Choose a category').required('Category is required'),
  price: Yup.number()
    .typeError('Price must be a number')
    .required('Price is required')
    .min(0, 'Price cannot be negative'),
  durationMinutes: Yup.number()
    .typeError('Duration must be a number')
    .required('Duration is required')
    .integer('Duration must be whole minutes')
    .min(0, 'Duration cannot be negative')
    .max(10_000, 'That is more than a working week'),
  // Empty is meaningful, not missing: it means "offered for every vehicle".
  appliesTo: Yup.array().of(Yup.string().oneOf(VEHICLE_TYPES).required()).default([]),
  isActive: Yup.boolean().default(true),
  isBookable: Yup.boolean().default(true),
})

export type ServiceFormType = Yup.InferType<typeof serviceFormSchema>

export const serviceInitialValues: ServiceFormType = {
  name: '',
  description: '',
  category: 'Washing',
  price: 0,
  durationMinutes: 30,
  appliesTo: [],
  isActive: true,
  isBookable: true,
}

export const toServiceFormValues = (service?: IService): ServiceFormType =>
  service
    ? {
        name: service.name,
        description: service.description,
        category: service.category,
        price: service.price,
        durationMinutes: service.durationMinutes,
        appliesTo: [...service.appliesTo],
        isActive: service.isActive,
        isBookable: service.isBookable,
      }
    : serviceInitialValues

/** "1 hr 15 min", "45 min", or a dash when the shop does not quote a time. */
export const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '—'
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}

/** What a service's vehicle restriction reads as in a table cell. */
export const appliesToLabel = (appliesTo: VehicleType[]): string =>
  appliesTo.length === 0 ? 'All vehicles' : appliesTo.join(', ')
