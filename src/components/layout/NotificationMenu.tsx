import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BellIcon } from '@heroicons/react/24/outline'
import { useGetDashboardSummary } from '@/components/Dashboard/dashboard-query'
import { useLang } from '@/context/LanguageContext'
import { timeAgo } from '@/lib/format'
import type { ActivityKind, IActivity } from '@/components/Dashboard/dashboard-schema'

/** Where each kind of event takes you when clicked. */
const ROUTE_FOR: Record<ActivityKind, string> = {
  job: '/job-cards',
  invoice: '/billing',
  customer: '/customers',
  vehicle: '/vehicles',
}

const DOT_FOR: Record<ActivityKind, string> = {
  job: 'bg-brand-500',
  invoice: 'bg-emerald-500',
  customer: 'bg-violet-500',
  vehicle: 'bg-accent-500',
}

/** Timestamp of the newest notification the user has already opened. */
const SEEN_KEY = 'gf_notifications_seen'

export default function NotificationMenu({ buttonClassName }: { buttonClassName: string }) {
  const { t } = useLang()
  const navigate = useNavigate()
  const { data } = useGetDashboardSummary()
  const [open, setOpen] = useState(false)
  const [seenAt, setSeenAt] = useState(() => localStorage.getItem(SEEN_KEY) ?? '')
  const boxRef = useRef<HTMLDivElement>(null)

  // Newest first — the feed is not guaranteed to arrive sorted.
  const items = useMemo(
    () => [...(data?.recentActivity ?? [])].sort((a, b) => b.at.localeCompare(a.at)),
    [data?.recentActivity],
  )
  const unread = items.filter((a) => a.at > seenAt).length

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markAllRead = () => {
    const newest = items[0]?.at ?? new Date().toISOString()
    localStorage.setItem(SEEN_KEY, newest)
    setSeenAt(newest)
  }

  const toggle = () => {
    setOpen((o) => {
      if (!o) markAllRead() // opening the panel counts as reading
      return !o
    })
  }

  const go = (activity: IActivity) => {
    setOpen(false)
    navigate(ROUTE_FOR[activity.kind] ?? '/')
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={toggle}
        className={clsx(buttonClassName, 'relative')}
        aria-label={t('topbar.notifications')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t('topbar.notifications')}
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent-400 px-1 text-[9px] font-bold text-ink-900 ring-2 ring-brand-700">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-md border border-ink-100 bg-white shadow-soft animate-fade-in">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
            <p className="text-sm font-bold text-ink-900">{t('topbar.notifications')}</p>
            <span className="text-xs text-ink-400">
              {items.length} {t('notifications.recent')}
            </span>
          </div>

          <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-ink-400">{t('notifications.empty')}</li>
            ) : (
              items.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => go(a)}
                    className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition hover:bg-ink-50"
                  >
                    <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', DOT_FOR[a.kind] ?? 'bg-ink-400')} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink-700">{a.text}</span>
                      <span className="block text-xs text-ink-400">{timeAgo(a.at)}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
