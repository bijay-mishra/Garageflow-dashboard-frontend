import type { ReactNode } from 'react'

/** Label + control wrapper for form modals. */
export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-600">{label}</span>
      {children}
    </label>
  )
}

export function ErrorText({ msg }: { msg: string }) {
  if (!msg) return null
  return <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">{msg}</p>
}
