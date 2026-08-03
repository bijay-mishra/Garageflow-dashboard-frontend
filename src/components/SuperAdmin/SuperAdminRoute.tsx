import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'

/**
 * The console door, for operators only.
 *
 * ProtectedRoute alone was not enough, and the gap was not theoretical. Signing
 * in as a company replaces the operator's session with an Owner one; navigating
 * back to /superadmin then loaded the whole console shell — sidebar, headings,
 * page furniture — while every request inside it was refused. The screen read
 * "Failed to load data. Please try again.", which is a lie: trying again does
 * nothing, because the session simply is not allowed to be there.
 *
 * The API was right the whole time. This is the client agreeing with it, so the
 * answer arrives as a redirect instead of as a wall of 403s.
 */
export default function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/superadmin" replace />

  // Sent to the dashboard either way, but for two different reasons. An ordinary
  // workshop account wandered in and belongs at its own dashboard. An operator
  // mid-impersonation is holding an Owner token, and the only route back to the
  // console is the banner there — it can restore their parked session, whereas
  // arriving at this URL cannot.
  if (user.role !== 'SuperAdmin') return <Navigate to="/" replace />

  return <>{children}</>
}
