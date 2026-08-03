import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import Logo from '@/components/common/Logo'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useAuth } from '@/context/AuthContext'
import type { StoredUser } from '@/lib/authStorage'
import { Spinner } from '@/components/common/loaders/States'

/**
 * The operator's way in, at /superadmin.
 *
 * Its own screen rather than a tab on the workshop login, because the two are
 * different doors: staff sign in with a company code, and the superadmin
 * belongs to no company and has none to give. Putting them together would mean
 * explaining on the main login that the code is sometimes optional, which is a
 * sentence no workshop owner should have to read.
 *
 * Being on its own URL is not a security measure and is not treated as one —
 * the API refuses anyone who is not a SuperAdmin whatever page they came from.
 * It is just a door in a quieter corridor.
 */
export default function SuperAdminLogin() {
  const navigate = useNavigate()
  const { signIn, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const res = await initApiRequest<{
        accessToken: string
        refreshToken: string
        user: StoredUser & { role: string }
      }>({
        apiDetails: {
          actionName: 'SA_LOGIN',
          controllerName: '/auth/login',
          requestMethod: RequestMethod.POST,
        },
        // No company code. The server falls back to an email-only lookup for
        // the two roles that have none — customers and this one.
        requestData: { companyCode: '', email: email.trim(), password },
      })

      const session = res?.data?.data

      if (!session?.accessToken) {
        setError(res?.data?.message ?? 'Could not sign in.')
        return
      }

      // Checked here as well as on the server. A workshop owner who wanders to
      // this URL would otherwise get a session and then a wall of 403s, which
      // reads as broken rather than as "wrong door".
      if (session.user.role !== 'SuperAdmin') {
        setError('That account is not a platform administrator. Sign in at /login.')
        return
      }

      signIn(session)
      navigate('/superadmin/overview', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setBusy(false)
    }
  }

  // After the hooks, never before — an early return above them would break the
  // rules of hooks the first time this rendered down the other branch.
  if (user?.role === 'SuperAdmin') {
    return <Navigate to="/superadmin/overview" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="rounded-2xl bg-white p-2.5 shadow-lg">
            <Logo variant="mark" className="h-11 w-11" />
          </span>

          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-white">
            Garage<span className="text-brand-200">Flow</span>
          </h1>

          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-white/25">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Platform admin
          </span>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-2xl">
          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="sa-email" className="mb-1.5 block text-xs font-semibold text-ink-600">
              Email
            </label>
            <input
              id="sa-email"
              type="email"
              className="input"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@garageflow.com"
            />
          </div>

          <div>
            <label htmlFor="sa-password" className="mb-1.5 block text-xs font-semibold text-ink-600">
              Password
            </label>
            <input
              id="sa-password"
              type="password"
              className="input"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <Spinner />} Sign in
          </button>

          <p className="text-center text-[11px] text-ink-400">
            Workshop staff sign in at{' '}
            <a href="/login" className="font-semibold text-brand-600">
              /login
            </a>
          </p>

          <p className="text-center text-[11px] text-ink-400">
            No company code — a platform administrator belongs to no company.
          </p>
        </form>
      </div>
    </div>
  )
}
