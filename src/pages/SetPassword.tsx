import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import Input from '@/components/common/form/Input'
import { Spinner } from '@/components/common/loaders/States'
import { useLogout, useSetPassword } from '@/components/Auth/auth-query'
import { setPasswordFormSchema, type SetPasswordFormType } from '@/components/Auth/auth-schema'
import { useAuth } from '@/context/AuthContext'
import { getRefreshToken } from '@/lib/authStorage'

/**
 * First sign-in: replace the password you were handed.
 *
 * Whoever set this account up — a GarageFlow operator creating the company, an
 * owner adding a mechanic — typed or read out the password it currently has.
 * Until it is replaced they can sign in as this account, and no amount of care
 * elsewhere makes up for that.
 *
 * This screen is a convenience rather than the control. The token from that
 * first sign-in reaches exactly one endpoint; closing this page and typing a
 * dashboard URL gets a wall of 403s, not a way round.
 */
export default function SetPassword() {
  const navigate = useNavigate()
  const { user, signIn, passwordWasSet, signOut } = useAuth()
  const setPassword = useSetPassword()
  const logout = useLogout()

  const [error, setError] = useState('')

  const formik = useFormik<SetPasswordFormType>({
    initialValues: { newPassword: '', confirmPassword: '' },
    validationSchema: setPasswordFormSchema,
    onSubmit: async (values) => {
      setError('')

      try {
        const res = await setPassword.mutateAsync({ newPassword: values.newPassword })
        const session = res?.data?.data

        if (!session) throw new Error('Could not set your password.')

        // A fresh pair, because the old ones were revoked on the way through.
        signIn({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
        })
        passwordWasSet()

        navigate('/', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not set your password.')
      }
    },
  })

  // Signing out here is a real need: somebody handed the wrong credentials, or
  // this is not their account. Without it the screen is a trap.
  const leave = async () => {
    const refreshToken = getRefreshToken()
    signOut()
    if (refreshToken) await logout.mutateAsync(refreshToken).catch(() => {})
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 shadow-glow">
            <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-ink-900">GarageFlow</p>
            <p className="text-xs text-ink-500">{user?.workshop}</p>
          </div>
        </div>

        <div className="card p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
            <ShieldCheckIcon className="h-5 w-5 text-brand-600" />
          </span>

          <h1 className="mt-4 text-lg font-bold text-ink-900">Choose your password</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            The password you signed in with was given to you by someone else. Pick your own — from
            now on, nobody else knows it.
          </p>

          <form onSubmit={formik.handleSubmit} className="mt-5 space-y-4">
            <Input
              name="newPassword"
              label="New password"
              type="password"
              formik={formik}
              placeholder="At least 8 characters"
            />

            <Input
              name="confirmPassword"
              label="Confirm password"
              type="password"
              formik={formik}
              placeholder="Type it again"
            />

            {error && (
              <p className="flex items-start gap-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={setPassword.isPending}>
              {setPassword.isPending && <Spinner />} Save and continue
            </button>
          </form>
        </div>

        <button
          onClick={leave}
          className="mt-4 w-full text-center text-xs font-medium text-ink-500 transition hover:text-ink-800"
        >
          Not your account? Sign out
        </button>
      </div>
    </div>
  )
}
