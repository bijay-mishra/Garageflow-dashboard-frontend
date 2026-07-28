import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronDownIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Logo from '@/components/common/Logo'
import { workshopInfo } from '@/data/seed'
import { useGetJobCardList } from '@/components/JobCard/jobcard-query'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
import { HOME, NAV, type NavItem } from '@/lib/navigation'

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
}

export default function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const { t } = useLang()
  const { user } = useAuth()
  const { data: jobs = [] } = useGetJobCardList()
  const openJobs = jobs.filter(
    (j) => j.status === 'Open' || j.status === 'In Progress' || j.status === 'Awaiting Parts',
  ).length

  // On the rail everything but the icons disappears (desktop only — the mobile
  // drawer always shows full labels).
  const hideOnRail = collapsed ? 'lg:hidden' : ''

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-100 bg-ink-50 transition-all duration-300 lg:translate-x-0',
          collapsed ? 'lg:w-20' : 'lg:w-72',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand — pinned to the same 68px as the topbar so the logo row and the
            navbar read as one continuous band. Fixed px rather than `h-16`: rem
            units track the 14px root, which made the bar 56px. */}
        <div
          className={clsx(
            'flex h-[68px] shrink-0 items-center justify-between gap-2 border-b border-ink-100 bg-white px-4',
            collapsed && 'lg:justify-center lg:px-0',
          )}
        >
          <Link
            to="/"
            onClick={onClose}
            aria-label={workshopInfo.name}
            className="min-w-0 rounded-md transition hover:opacity-80"
          >
            <Logo textClassName={hideOnRail} />
          </Link>
          <button onClick={onClose} className="shrink-0 rounded-md p-1.5 text-ink-500 hover:bg-ink-50 lg:hidden">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Signed-in account — its own card, with clear space under the header. */}
        <div
          className={clsx(
            'mx-4 mt-3 flex shrink-0 items-center gap-2.5 rounded-md border border-ink-100 bg-white px-3 py-2',
            collapsed && 'lg:mx-2 lg:justify-center lg:px-0',
          )}
          title={user?.email}
        >
          <span className="relative flex shrink-0">
            <UserCircleIcon className="h-6 w-6 text-ink-400" />
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <p className={clsx('truncate text-xs font-medium text-ink-600', hideOnRail)}>{user?.email}</p>
        </div>

        {/* Nav */}
        <nav className={clsx('flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-3', collapsed && 'lg:px-2')}>
          {/* Home stands on its own, above the module list. */}
          <Item item={HOME} collapsed={collapsed} onNavigate={onClose} />

          <p className={clsx('px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-400', hideOnRail)}>
            {t('sidebar.modules')}
          </p>

          {NAV.map((item) =>
            item.children ? (
              <NavGroup key={item.labelKey} item={item} collapsed={collapsed} onNavigate={onClose} />
            ) : (
              <Item key={item.to} item={item} collapsed={collapsed} onNavigate={onClose} badge={item.to === '/job-cards' ? openJobs : 0} />
            ),
          )}
        </nav>

        {/* Support card — hidden on the rail */}
        <div className={clsx('m-4 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-glow', hideOnRail)}>
          <p className="text-sm font-semibold">{t('sidebar.upgradeTitle')}</p>
          <p className="mt-1 text-xs text-brand-100">{t('sidebar.upgradeText')}</p>
          <Link
            to="/plans"
            onClick={onClose}
            className="mt-3 block w-full rounded-md bg-white/15 py-2 text-center text-xs font-semibold backdrop-blur transition hover:bg-white/25"
          >
            {t('sidebar.viewPlans')}
          </Link>
        </div>
      </aside>
    </>
  )
}

/** A single navigable row. `depth` indents nested children. */
function Item({
  item,
  collapsed,
  onNavigate,
  badge = 0,
  depth = 0,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate: () => void
  badge?: number
  depth?: number
}) {
  const { t } = useLang()
  const Icon = item.icon
  const hideOnRail = collapsed ? 'lg:hidden' : ''

  return (
    <NavLink
      to={item.to!}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? t(item.labelKey) : undefined}
      className={({ isActive }) =>
        clsx(
          'nav-link',
          isActive && 'nav-link-active',
          depth > 0 && 'pl-9',
          collapsed && 'lg:justify-center lg:gap-0 lg:px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active marker — a dot in the navbar's blue, positioned absolutely so
              it never shifts the row's layout. */}
          {isActive && (
            <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-700" />
          )}
          <span className="relative flex shrink-0 items-center">
            <Icon className={clsx('shrink-0', depth > 0 ? 'h-4 w-4' : 'h-5 w-5')} />
            {/* On the rail the count collapses into a dot on the icon. */}
            {collapsed && badge > 0 && (
              <span className="absolute -right-1 -top-1 hidden h-2 w-2 rounded-full bg-brand-600 ring-2 ring-ink-50 lg:block" />
            )}
          </span>
          <span className={clsx('flex-1 truncate', hideOnRail)}>{t(item.labelKey)}</span>
          {badge > 0 && (
            <span className={clsx('rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white', hideOnRail)}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/**
 * A parent row that expands to reveal its children. Opens automatically when
 * one of its children is the current route; on the rail it links straight to
 * the first child, since there is no room to expand.
 */
function NavGroup({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate: () => void }) {
  const { t } = useLang()
  const { pathname } = useLocation()
  const children = item.children ?? []
  const hasActiveChild = children.some((c) => c.to && pathname.startsWith(c.to))
  const [open, setOpen] = useState(hasActiveChild)
  const Icon = item.icon
  const expanded = open || hasActiveChild

  if (children.length === 0) return null

  if (collapsed) {
    return (
      <div className="hidden lg:block">
        <Item item={{ ...children[0], icon: Icon, labelKey: item.labelKey }} collapsed onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={expanded}
        className={clsx('nav-link w-full', hasActiveChild && 'text-ink-900')}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate text-left">{t(item.labelKey)}</span>
        <ChevronDownIcon className={clsx('h-4 w-4 shrink-0 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="mt-1 space-y-1 border-l border-ink-200 pl-2">
          {children.map((child) => (
            <Item key={child.to} item={child} collapsed={false} onNavigate={onNavigate} depth={1} />
          ))}
        </div>
      )}
    </div>
  )
}
