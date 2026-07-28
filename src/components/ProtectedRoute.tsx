import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

/**
 * Gate for the authenticated part of the app.
 *
 * This is convenience, not security — the token is what actually protects the
 * data, and every business endpoint requires it. Removing this component would
 * only mean seeing empty pages full of 401s.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  // Remember where they were headed so login can send them back there.
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />

  return <>{children}</>
}
