import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { forgetImpersonation, getImpersonatedCompany } from '@/lib/authStorage'

/**
 * Gate for the authenticated part of the app.
 *
 * This is convenience, not security — the token is what actually protects the
 * data, and every business endpoint requires it. Removing this component would
 * only mean seeing empty pages full of 401s.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, mustSetPassword } = useAuth()
  const location = useLocation()

  if (!user) {
    // An operator whose impersonated session ran out belongs back at the console
    // door, not at the workshop's. Impersonated tokens carry no refresh token on
    // purpose, so they expire after fifteen minutes and cannot be renewed —
    // sending the operator to /login would ask them for a company code they do
    // not have, for a workshop that is not theirs.
    if (getImpersonatedCompany()) {
      forgetImpersonation()
      return <Navigate to="/superadmin" replace />
    }

    // Remember where they were headed so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  // Still on the password they were handed. Every other endpoint refuses this
  // token, so anywhere else would render a screen of "Failed to load data".
  if (mustSetPassword && location.pathname !== '/set-password') {
    return <Navigate to="/set-password" replace />
  }

  return <>{children}</>
}
