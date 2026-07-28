import type { ReactNode } from 'react'
import clsx from 'clsx'
import Breadcrumbs from './Breadcrumbs'

interface StickyHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
  /** Set false to let the header scroll away with the page. */
  sticky?: boolean
  /** Set false to show the plain title instead of the route trail. */
  breadcrumbs?: boolean
}

/**
 * Sticky page bar: route trail on the left, actions on the right. Pinned under
 * the 4rem topbar so the actions stay reachable while the list scrolls.
 */
export default function StickyHeader({
  title,
  subtitle,
  children,
  sticky = true,
  breadcrumbs = true,
}: StickyHeaderProps) {
  return (
    <div
      className={clsx(
        'mb-3 flex flex-col gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4',
        sticky && 'sticky top-[68px] z-10 shadow-card',
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        {breadcrumbs ? <Breadcrumbs current={title} /> : <h1 className="truncate text-sm font-bold text-ink-900">{title}</h1>}
        {subtitle && <p className="truncate text-xs text-ink-400">{subtitle}</p>}
      </div>

      {children && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{children}</div>}
    </div>
  )
}
