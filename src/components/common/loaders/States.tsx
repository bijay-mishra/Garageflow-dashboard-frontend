import type { ComponentType, ReactNode } from 'react'

/** Inline spinner used inside buttons and small areas. */
export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <span className={`spinner ${className}`} aria-label="Loading" role="status" />
}

/** Full-panel loading placeholder. */
export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
      <Spinner className="h-7 w-7 text-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

/** Empty / no-results placeholder. */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-2 text-sm font-bold text-ink-800">{title}</h3>
      {message && <p className="max-w-xs text-sm text-ink-400">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorBlock({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-semibold text-rose-600">Something went wrong</p>
      <p className="max-w-sm text-sm text-ink-400">{message ?? 'Failed to load data. Please try again.'}</p>
    </div>
  )
}
