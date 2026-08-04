import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BuildingOffice2Icon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  MoonIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  SunIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { UserCircleIcon as UserCircleSolidIcon } from '@heroicons/react/24/solid'
import Avatar from '@/components/common/Avatar'
import Flag from '@/components/common/Flag'
import Logo from '@/components/common/Logo'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useLogout } from '@/components/Auth/auth-query'
import { getRefreshToken } from '@/lib/authStorage'
import { LANGS } from '@/lib/i18n'

/**
 * The operator console's own chrome.
 *
 * Structurally separate from the workshop dashboard's <Layout> because almost
 * nothing there applies: that sidebar lists a workshop's modules, its topbar
 * switches branch and fiscal year, and its module gate hides routes per company.
 * An operator is inside no company, so every one of those would be empty or
 * wrong.
 *
 * Visually, though, it is the same product. Same brand bar, same light sidebar,
 * same avatar menu, same language picker, same theme toggle, same 68px band
 * across the top. An earlier version made this console dark to signal "you are
 * on the platform" — but the signal cost more than it bought: it read as a
 * different, half-finished application, and the operator is the same person who
 * uses the dashboard all day. Which company you are in is answered by the
 * sidebar and the page you are on, not by the colour of the furniture.
 */
export default function SuperAdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const nav = [
    { to: '/superadmin/overview', label: 'Overview', icon: Squares2X2Icon },
    { to: '/superadmin/companies', label: 'Companies', icon: BuildingOffice2Icon },
    { to: '/superadmin/configuration', label: 'Configuration', icon: Cog6ToothIcon },
    { to: '/superadmin/audit', label: 'Access log', icon: ClipboardDocumentListIcon },
  ]

  return (
    <div className="min-h-screen bg-ink-50">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-100 bg-ink-50 transition-transform duration-300 lg:translate-x-0',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Pinned to the same 68px as the topbar so the logo row and the navbar
            read as one continuous band. Fixed px rather than `h-16`: rem units
            track the 14px root, which made the bar 56px. */}
        <div className="flex h-[68px] shrink-0 items-center justify-between gap-2 border-b border-ink-100 bg-white px-4">
          <Logo />
          <button
            onClick={() => setDrawerOpen(false)}
            className="shrink-0 rounded-md p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Who you are. The dashboard's sidebar carries the same card in the same
            place — an operator glancing at it should not have to re-learn where
            to look. */}
        <div className="mx-4 mt-3 flex shrink-0 items-center gap-2.5 rounded-md border border-brand-100 bg-brand-50 px-3 py-2">
          <ShieldCheckIcon className="h-5 w-5 shrink-0 text-brand-600" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-brand-800">Platform administrator</p>
            <p className="truncate text-[11px] text-brand-600">All companies</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-3">
          <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
            Platform
          </p>

          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="m-4 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-glow">
          <p className="text-sm font-semibold">Handle with care</p>
          <p className="mt-1 text-xs text-brand-100">
            What you change here affects real businesses and their customers.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <ConsoleTopbar onMenu={() => setDrawerOpen(true)} />
        <Outlet />
      </div>
    </div>
  )
}

/** Shared styling for the round icon buttons sitting on the brand-blue bar. */
const barButton =
  'flex h-10 w-10 items-center justify-center rounded-md text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60'

/**
 * The console's brand bar — the dashboard's topbar, minus what needs a company.
 *
 * Sign out used to live only at the foot of the sidebar, below the nav and above
 * nothing: the one corner of a screen people do not look at when they want to
 * leave. It is now behind the avatar at top right, where this product's own
 * dashboard puts it.
 */
function ConsoleTopbar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { lang, setLang, t } = useLang()
  const logoutMutation = useLogout()

  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const active = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-brand-700 to-brand-800 shadow-[0_1px_12px_-2px_rgba(15,23,41,0.35)]">
      <div className="flex h-[68px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <button
          onClick={onMenu}
          className={clsx(barButton, 'shrink-0 lg:hidden')}
          aria-label={t('topbar.expand')}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-white">GarageFlow</p>
          <p className="truncate text-xs text-brand-200">Platform administration</p>
        </div>

        <div className="flex-1" />

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <span className="mr-1 hidden items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/20 sm:flex">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Superadmin
          </span>

          {/* Language. The console is read by the same people who read the
              dashboard in Nepali, and leaving it English-only made it feel like
              a different, lesser product. */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              className={clsx(barButton, 'w-auto gap-1.5 px-2')}
              aria-label={t('topbar.language')}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              title={`${t('topbar.language')} · ${active.long}`}
            >
              <span className="flex w-7 justify-center">
                <Flag code={active.flag} className="h-5 shadow-sm" />
              </span>
              <ChevronDownIcon className={clsx('h-3.5 w-3.5 transition', langOpen && 'rotate-180')} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-ink-100 bg-white p-1 shadow-soft animate-fade-in">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code)
                      setLangOpen(false)
                    }}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                      lang === l.code ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
                    )}
                  >
                    <span className="flex w-7 justify-center">
                      <Flag code={l.flag} className="h-5" />
                    </span>
                    <span className="flex-1 text-left">{l.long}</span>
                    {lang === l.code && <CheckIcon className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggle}
            className={barButton}
            aria-label={t('topbar.theme')}
            title={t('topbar.theme')}
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={t('topbar.myAccount')}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.name ?? t('topbar.myAccount')}
            >
              <UserCircleSolidIcon className="h-9 w-9 text-brand-200" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-md border border-ink-100 bg-white shadow-soft animate-fade-in">
                <div className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-800 px-4 py-3.5 text-white">
                  <span className="inline-flex rounded-full ring-2 ring-white/40">
                    <Avatar name={user?.name ?? 'Admin'} size="md" color="bg-white/25" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user?.name}</p>
                    <p className="truncate text-xs text-brand-200">{user?.email}</p>
                  </div>
                </div>

                <p className="border-b border-ink-100 px-4 py-2.5 text-[11px] leading-relaxed text-ink-500">
                  Platform administrator. Belongs to no company, and can reach all of them.
                </p>

                <button
                  onClick={() => {
                    // Order matters. Clearing the session and navigating away
                    // first unmounts the console, so nothing is left mounted to
                    // fire further requests. The revoke call then goes out on
                    // its own — and a failed one must never trap someone in a
                    // session they asked to leave.
                    const refreshToken = getRefreshToken()
                    signOut()
                    navigate('/superadmin', { replace: true })
                    if (refreshToken) logoutMutation.mutate(refreshToken)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" />
                  {t('topbar.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/** The heading strip every console page opens with. */
export function ConsoleHeader({
  title,
  subtitle,
  /** Sits left of the title. A company's page passes its logo. */
  icon,
  children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {icon}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-ink-900">{title}</h1>
            {subtitle && <p className="mt-0.5 truncate text-sm text-ink-500">{subtitle}</p>}
          </div>
        </div>

        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
    </header>
  )
}
