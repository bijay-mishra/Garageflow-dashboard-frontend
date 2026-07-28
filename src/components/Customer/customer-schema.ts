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
})

export type CustomerFormType = Yup.InferType<typeof customerFormSchema>

export const customerInitialValues: CustomerFormType = {
  name: '',
  phone: '',
  email: '',
  address: '',
}

/** Seeds the form when editing — the server owns every other field. */
export const toCustomerFormValues = (customer?: ICustomer): CustomerFormType =>
  customer
    ? {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      }
    : customerInitialValues
