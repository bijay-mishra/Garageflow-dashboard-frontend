import { Link } from 'react-router-dom'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { useModules, MODULE_LABELS, type ModuleName } from '@/context/ModuleContext'

/**
 * A page this company may not have.
 *
 * Shows an explanation rather than redirecting. Somebody reaching /deliveries
 * has usually followed a bookmark or a link from someone at the same workshop,
 * and bouncing them to the dashboard tells them nothing about why the page they
 * were sent to is not there.
 *
 * This is the door being closed politely, not the lock. The delivery endpoints
 * behind it refuse on their own; nothing here is load-bearing for security, and
 * it should not be written as though it were.
 */
export default function ModuleRoute({
  module,
  children,
}: {
  module: ModuleName
  children: React.ReactNode
}) {
  const { has, loading } = useModules()

  // Nothing while the answer is in flight. Rendering the page and snatching it
  // back a moment later is worse than a blank beat.
  if (loading) return null

  if (has(module)) return <>{children}</>

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <span className="rounded-xl bg-ink-100 p-3">
        <LockClosedIcon className="h-6 w-6 text-ink-400" />
      </span>

      <h1 className="mt-4 text-base font-bold text-ink-900">
        {MODULE_LABELS[module]} is not enabled
      </h1>

      <p className="mt-1.5 max-w-sm text-sm text-ink-500">
        This part of GarageFlow is not turned on for your workshop. Your data is untouched — ask
        your administrator to enable it.
      </p>

      <div className="mt-5 flex gap-2">
        <Link to="/" className="btn-ghost">
          Back to dashboard
        </Link>
        <Link to="/plans" className="btn-primary">
          See what's included
        </Link>
      </div>
    </div>
  )
}
