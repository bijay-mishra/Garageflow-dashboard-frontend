import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import { useResetPassword } from '@/components/Auth/auth-query'
import {
  resetPasswordInitialValues,
  resetPasswordSchema,
  type ResetPasswordFormType,
} from '@/components/Auth/auth-schema'
import { workshopInfo } from '@/data/seed'

/**
 * Landing page for the emailed reset link: `/reset-password?token=…`.
 *
 * The token is only ever passed through to the API — the client cannot tell
 * whether it is valid, so the server's message is what the user sees.
 */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''
  const resetPassword = useResetPassword()
  const [error, setError] = useState('')

  const formik = useFormik<ResetPasswordFormType>({
    initialValues: resetPasswordInitialValues,
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      setError('')
      try {
        await resetPassword.mutateAsync({ token, newPassword: values.newPassword })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reset your password.')
      }
    },
  })

  const done = resetPassword.isSuccess

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 shadow-glow">
            <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-ink-900">{workshopInfo.name}</p>
            <p className="text-xs text-ink-400">{workshopInfo.tagline}</p>
          </div>
        </div>

        {!token ? (
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <ExclamationTriangleIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink-900">Link is incomplete</h2>
            <p className="mt-1 text-sm text-ink-500">
              This page needs the token from your reset email. Request a new link and open it directly.
            </p>
            <Link to="/forgot-password" className="btn-primary mt-6 w-full">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircleIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink-900">Password updated</h2>
            <p className="mt-1 text-sm text-ink-500">{resetPassword.data?.data?.message}</p>
            <button className="btn-primary mt-6 w-full" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-ink-900">Choose a new password</h2>
            <p className="mt-1 text-sm text-ink-500">
              Signing in again on your other devices will be required.
            </p>

            <form onSubmit={formik.handleSubmit} className="mt-8 space-y-4">
              {error && (
                <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                  {error}
                </p>
              )}

              <PasswordField
                name="newPassword"
                label="New password"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.submitCount > 0 ? formik.errors.newPassword : undefined}
              />

              <PasswordField
                name="confirmPassword"
                label="Confirm new password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.submitCount > 0 ? formik.errors.confirmPassword : undefined}
              />

              <button type="submit" className="btn-primary w-full" disabled={resetPassword.isPending}>
                {resetPassword.isPending && <Spinner />} Reset password
              </button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

interface PasswordFieldProps {
  name: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
}

function PasswordField({ name, label, value, onChange, onBlur, error }: PasswordFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-600">{label}</span>
      <div className="relative">
        <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          name={name}
          className="input pl-10"
          type="password"
          autoComplete="new-password"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </label>
  )
}
