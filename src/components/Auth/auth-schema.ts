import * as Yup from 'yup'

// ── Auth contract ────────────────────────────────────────────────────────────

/** Minimum the API will accept — mirrors the StringLength on the .NET side. */
export const MIN_PASSWORD_LENGTH = 8

/** The signed-in user, from `/auth/login` and `/auth/me`. */
export interface IAuthUser {
  id: string
  email: string
  name: string
  role: 'Owner' | 'Manager' | 'Advisor'
  workshop: string
  companyCode: string
  phone?: string
}

/** What a successful login or refresh returns. */
export interface IAuthResult {
  accessToken: string
  /** UTC ISO datetime. */
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
  user: IAuthUser
}

// ── Sign in ──────────────────────────────────────────────────────────────────

export const loginFormSchema = Yup.object({
  companyCode: Yup.string().trim().required('Company code is required'),
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
})

export type LoginFormType = Yup.InferType<typeof loginFormSchema>

/**
 * Prefilled sign-in for the seeded demo account.
 *
 * Matches `DbSeeder.Demo*` on the API. Clear these before this goes anywhere
 * real — a login form that fills in working credentials is a back door.
 */
export const loginInitialValues: LoginFormType = {
  companyCode: 'DEMO',
  email: 'bijaymishra276@gmail.com',
  password: 'demo1234',
}

// ── Forgot password ──────────────────────────────────────────────────────────

export const forgotPasswordSchema = Yup.object({
  companyCode: Yup.string().trim().required('Company code is required'),
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
})

export type ForgotPasswordFormType = Yup.InferType<typeof forgotPasswordSchema>

export const forgotPasswordInitialValues: ForgotPasswordFormType = {
  companyCode: 'DEMO',
  email: '',
}

// ── Reset password ───────────────────────────────────────────────────────────

export const resetPasswordSchema = Yup.object({
  newPassword: Yup.string()
    .required('New password is required')
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  confirmPassword: Yup.string()
    .required('Confirm your new password')
    // Confirmation is a client-side concern; the API only ever sees newPassword.
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match'),
})

export type ResetPasswordFormType = Yup.InferType<typeof resetPasswordSchema>

export const resetPasswordInitialValues: ResetPasswordFormType = {
  newPassword: '',
  confirmPassword: '',
}

// ── Profile ──────────────────────────────────────────────────────────────────

export const profileFormSchema = Yup.object({
  name: Yup.string().trim().required('Name is required').max(160, 'Name is too long'),
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  phone: Yup.string().trim().max(40, 'Phone is too long').default(''),
})

export type ProfileFormType = Yup.InferType<typeof profileFormSchema>

export const toProfileFormValues = (user?: IAuthUser | null): ProfileFormType => ({
  name: user?.name ?? '',
  email: user?.email ?? '',
  phone: user?.phone ?? '',
})

// ── Change password ──────────────────────────────────────────────────────────

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  confirmPassword: Yup.string()
    .required('Confirm your new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match'),
})

export type ChangePasswordFormType = Yup.InferType<typeof changePasswordSchema>

export const changePasswordInitialValues: ChangePasswordFormType = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}
