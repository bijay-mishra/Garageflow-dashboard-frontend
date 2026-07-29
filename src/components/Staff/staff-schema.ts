import * as Yup from 'yup'

// ── Staff contract ───────────────────────────────────────────────────────────
// Accounts inside this workshop. Mirrors UserDto / CreateUserRequest on the .NET
// side, where the endpoints are Owner-and-Manager only — an advisor can run the
// front desk without being able to hand out credentials.

/**
 * Roles an account can hold.
 *
 * The first three sign into this dashboard. The last two sign into the mobile
 * app instead and each see one slice of the workshop: a Mechanic sees the jobs
 * assigned to them, a Customer sees only their own vehicles.
 */
export const USER_ROLES = ['Owner', 'Manager', 'Advisor', 'Mechanic', 'Customer'] as const

export type UserRole = (typeof USER_ROLES)[number]

/** Roles that may open the web dashboard. */
export const STAFF_ROLES: UserRole[] = ['Owner', 'Manager', 'Advisor']

/** An account as `GET /api/users` returns it. */
export interface IStaff {
  id: string
  email: string
  name: string
  role: UserRole
  phone: string | null
  /** A disabled account keeps its history but cannot sign in. */
  isActive: boolean
  /**
   * Set for Mechanic accounts — the name written on job cards that this login
   * claims. A name rather than a foreign key because job cards have always
   * recorded their mechanic as free text.
   */
  mechanicName: string | null
  /** Set for Customer accounts — the customer record this login speaks for. */
  customerId: string | null
  customerName: string | null
  createdAt: string
  lastLoginAt: string | null
}

export const staffFormSchema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(160, 'Name is too long'),
  email: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required('Email is required')
    .max(160, 'Email is too long'),
  role: Yup.string().oneOf(USER_ROLES, 'Choose a role').required('Role is required'),
  phone: Yup.string().trim().max(40, 'Phone is too long').default(''),

  // Required only for a mechanic, because it is the link between the account and
  // the jobs it can see. Getting it wrong means an app that signs in fine and
  // shows an empty list, which is the least helpful failure available.
  mechanicName: Yup.string()
    .trim()
    .max(120, 'Name is too long')
    .default('')
    .when('role', {
      is: 'Mechanic',
      then: (schema) => schema.required('A mechanic needs the name their jobs are assigned under'),
    }),

  customerId: Yup.string()
    .trim()
    .max(20)
    .default('')
    .when('role', {
      is: 'Customer',
      then: (schema) => schema.required('A customer login needs the customer it speaks for'),
    }),

  // Blank on edit means "leave the password alone"; the API only resets it when
  // a value is actually sent.
  password: Yup.string()
    .default('')
    .test('length', 'Password must be at least 8 characters', (value) => !value || value.length >= 8),
})

export type StaffFormType = Yup.InferType<typeof staffFormSchema>

export const staffInitialValues: StaffFormType = {
  name: '',
  email: '',
  role: 'Mechanic',
  phone: '',
  mechanicName: '',
  customerId: '',
  password: '',
}

export const toStaffFormValues = (staff?: IStaff): StaffFormType =>
  staff
    ? {
        name: staff.name,
        email: staff.email,
        role: staff.role,
        phone: staff.phone ?? '',
        mechanicName: staff.mechanicName ?? '',
        customerId: staff.customerId ?? '',
        // Never prefilled. There is nothing to prefill it with — only the hash
        // is stored — and an apparently-filled box invites an accidental reset.
        password: '',
      }
    : staffInitialValues
