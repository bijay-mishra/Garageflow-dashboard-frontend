import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/common/Avatar'
import Logo from '@/components/common/Logo'
import { workshopInfo } from '@/data/seed'
import { useGetDashboardSummary } from '@/components/Dashboard/dashboard-query'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
import { useMenu, type MenuNode } from '@/context/MenuContext'
import { iconFor } from '@/lib/menuIcons'

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
}

/**
 * The menu, as the server assembled it for this person.
 *
 * Nothing here decides what appears. The rows, their order, their wording and
 * their icons all arrive from GET /menus, already filtered by what the company
 * bought and what this role has been granted. That used to be a hardcoded array
 * compiled into the bundle, so every workshop got the same menu and "the front
 * desk shouldn't see the takings" was a feature request rather than a setting.
 */
export default function Sidebar({ open, collapsed, onClose }: SidebarProps) {
  const { t } = useLang()
  const { user } = useAuth()
  const { tree, loading } = useMenu()

  // The badge is one number, so it comes from the dashboard aggregate rather
  // than from downloading every job card to count them here. NotificationMenu
  // already holds this query, so the sidebar costs no extra request.
  const { data: summary } = useGetDashboardSummary()
  const openJobs = summary?.openJobs ?? 0

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
          {/* The product mark, always. A company's uploaded logo never appears
              here — it goes on the invoices they issue, not on the application
              they are using. */}
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

        {/* Signed-in account — a card that goes somewhere. It sat here as a bare
            line of email text, which read as a stray label rather than as the
            account it names; the two lines now carry who you are and the row is
            the way to your own settings. */}
        <Link
          to="/account"
          onClick={onClose}
          title={user?.email}
          className={clsx(
            'group mx-3 mt-3 flex shrink-0 items-center gap-2.5 rounded-xl border border-ink-100 bg-white px-2.5 py-2',
            'shadow-card transition-all duration-150 hover:border-brand-200 hover:shadow-soft',
            collapsed && 'lg:mx-2 lg:justify-center lg:px-0 lg:py-2',
          )}
        >
          <span className="relative flex shrink-0">
            <Avatar
              name={user?.name || user?.email || 'User'}
              size="sm"
              color="bg-gradient-to-br from-brand-500 to-brand-700"
            />
            {/* Online indicator — ringed in the card's own white so it reads as
                sitting on top of the avatar rather than notched out of it. */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <span className={clsx('min-w-0 flex-1 leading-tight', hideOnRail)}>
            <span className="block truncate text-xs font-semibold text-ink-900">
              {user?.name || user?.email}
            </span>
            {/* The role, not the email again. It is the shorter line and the one
                that explains why the menu above looks the way it does. */}
            <span className="block truncate text-[10px] font-medium uppercase tracking-wider text-ink-400">
              {user?.role}
            </span>
          </span>
        </Link>

        {/* Nav */}
        <nav className={clsx('flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-3', collapsed && 'lg:px-2')}>
          {loading ? (
            // Grey bars rather than an empty rail. A menu that arrives a beat
            // late should look like it is arriving, not like it is missing.
            <div className="space-y-2 pt-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-ink-100" />
              ))}
            </div>
          ) : (
            <>
              {/* No "MODULES" heading above this. It labelled a list that needs
                  no label — there is one nav in the sidebar and everybody can
                  see what it is — and cost a row of vertical space on every
                  screen to say so. */}
              {tree.map((item) =>
                item.children.length > 0 ? (
                  <NavGroup key={item.key} item={item} collapsed={collapsed} onNavigate={onClose} />
                ) : (
                  <Item
                    key={item.key}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={onClose}
                    badge={item.route === '/job-cards' ? openJobs : 0}
                  />
                ),
              )}
            </>
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
  item: MenuNode
  collapsed: boolean
  onNavigate: () => void
  badge?: number
  depth?: number
}) {
  const { label } = useMenu()
  const Icon = iconFor(item.icon)
  const hideOnRail = collapsed ? 'lg:hidden' : ''
  const text = label(item)

  return (
    <NavLink
      to={item.route}
      // Only home matches by prefix everywhere else, so it needs the exact rule
      // or it stays lit on every page.
      end={item.route === '/'}
      onClick={onNavigate}
      title={collapsed ? text : undefined}
      className={({ isActive }) =>
        clsx(
          'nav-link',
          isActive && 'nav-link-active',
          collapsed && 'lg:justify-center lg:gap-0 lg:px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active marker — a half-round arc on the sidebar's own edge rather
              than a dot beside the label. Absolutely positioned, so it never
              shifts the row; the negative inset cancels the nav's padding so the
              flat side lands exactly on the sidebar edge (or, for a child row,
              on the group's guide line).

              Rail and drawer carry different padding — px-2 against px-4 — so
              the collapsed offset only applies from `lg` up. */}
          {isActive && (
            <span
              aria-hidden
              className={clsx(
                'nav-arc',
                depth > 0 ? 'h-5 w-[3px] -left-3' : 'h-7 w-1.5 -left-4',
                depth === 0 && collapsed && 'lg:-left-2',
              )}
            />
          )}
          <span className="relative flex shrink-0 items-center">
            <Icon className={clsx('shrink-0', depth > 0 ? 'h-4 w-4' : 'h-5 w-5')} />
            {/* On the rail the count collapses into a dot on the icon. */}
            {collapsed && badge > 0 && (
              <span className="absolute -right-1 -top-1 hidden h-2 w-2 rounded-full bg-brand-600 ring-2 ring-ink-50 lg:block" />
            )}
          </span>
          <span className={clsx('flex-1 truncate', hideOnRail)}>{text}</span>
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
function NavGroup({
  item,
  collapsed,
  onNavigate,
}: {
  item: MenuNode
  collapsed: boolean
  onNavigate: () => void
}) {
  const { label } = useMenu()
  const { pathname } = useLocation()
  const children = item.children
  const hasActiveChild = children.some((c) => c.route && pathname.startsWith(c.route))
  const [open, setOpen] = useState(hasActiveChild)
  const Icon = iconFor(item.icon)
  const expanded = open || hasActiveChild

  if (children.length === 0) return null

  if (collapsed) {
    return (
      <div className="hidden lg:block">
        <Item item={{ ...children[0], icon: item.icon }} collapsed onNavigate={onNavigate} />
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={expanded}
        className={clsx('nav-link w-full', hasActiveChild && 'font-semibold text-ink-900')}
      >
        <Icon className={clsx('h-5 w-5 shrink-0', hasActiveChild && 'text-brand-600')} />
        <span className="flex-1 truncate text-left">{label(item)}</span>
        <ChevronDownIcon
          className={clsx('h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200', expanded && 'rotate-180')}
        />
      </button>

      {expanded && (
        // The guide line sits where the parent's icon sits, so the children read
        // as hanging off their parent rather than as a second list. It is also
        // what the active child's arc lands on — see `nav-arc` in Item.
        <div className="ml-4 mt-1 space-y-1 border-l border-ink-200 pl-3">
          {children.map((child) => (
            <Item key={child.key} item={child} collapsed={false} onNavigate={onNavigate} depth={1} />
          ))}
        </div>
      )}
    </div>
  )
}
