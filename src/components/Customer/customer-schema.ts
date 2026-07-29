import * as Yup from 'yup'

// ── Customer contract ────────────────────────────────────────────────────────
// `ICustomer` mirrors CustomerDto on the .NET side. The Yup schema below is the
// single source of truth for the add/edit form: the TypeScript type is inferred
// from it, so a field cannot drift between validation and form state.

/** A customer as `GET /api/customers` returns it. */
export interface ICustomer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  /**
   * Map pin, or null if nobody has placed one — which is most customers.
   *
   * Separate from `address` because the two answer different questions: the
   * address is what goes on an invoice, the pin is where a pickup driver
   * actually navigates to. "Baneshwor, near the temple" is a fine address and a
   * useless destination.
   */
  latitude: number | null
  longitude: number | null
  /** Vehicles on file — computed server-side. */
  vehicleCount: number
  /** Lifetime amount billed, tax included — computed server-side. */
  totalSpent: number
  /** ISO date, e.g. `2025-03-11`. */
  createdAt: string
  /** Tailwind class for the list avatar. */
  avatarColor: string
}

export const customerFormSchema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(160, 'Name is too long'),
  phone: Yup.string().trim().required('Phone is required').max(40, 'Phone is too long'),
  email: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .max(160, 'Email is too long')
    .default(''),
  address: Yup.string().trim().max(300, 'Address is too long').default(''),
  // Nullable rather than optional, and always sent. A partial update reads an
  // absent field as "leave it alone", so `null` is how the form says "no pin"
  // — paired with `clearLocation` below, which is what actually removes one.
  latitude: Yup.number().nullable().default(null),
  longitude: Yup.number().nullable().default(null),
})

export type CustomerFormType = Yup.InferType<typeof customerFormSchema>

/**
 * What `PUT /api/customers/{id}` accepts. Wider than the form: removing a pin
 * cannot be expressed by sending null, because a partial update ignores absent
 * and null alike, so it needs its own flag.
 */
export type UpdateCustomerRequest = CustomerFormType & { clearLocation?: boolean }

export const customerInitialValues: CustomerFormType = {
  name: '',
  phone: '',
  email: '',
  address: '',
  latitude: null,
  longitude: null,
}

/** Seeds the form when editing — the server owns every other field. */
export const toCustomerFormValues = (customer?: ICustomer): CustomerFormType =>
  customer
    ? {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        latitude: customer.latitude,
        longitude: customer.longitude,
      }
    : customerInitialValues
