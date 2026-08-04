import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  Bars3Icon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  KeyIcon,
  CheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { UserCircleIcon as UserCircleSolidIcon } from '@heroicons/react/24/solid'
import Avatar from '@/components/common/Avatar'
import Flag from '@/components/common/Flag'
import GlobalSearch from './GlobalSearch'
import NotificationMenu from './NotificationMenu'
import WorkspacePicker from './WorkspacePicker'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { useLogout } from '@/components/Auth/auth-query'
import { getRefreshToken } from '@/lib/authStorage'
import { useLang } from '@/context/LanguageContext'
import { useGetWorkshop } from '@/components/Workshop/workshop-query'
import { LANGS } from '@/lib/i18n'

interface TopbarProps {
  collapsed: boolean
  onMenu: () => void
  onToggleCollapse: () => void
}

/** Shared styling for the round icon buttons sitting on the brand-blue bar. */
const barButton =
  'flex h-10 w-10 items-center justify-center rounded-md text-white/90 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60'

export default function Topbar({ collapsed, onMenu, onToggleCollapse }: TopbarProps) {
  const { theme, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const logoutMutation = useLogout()
  const { lang, setLang, t } = useLang()

  // Shared with the sidebar and the printed invoice — one cached query, not
  // three requests. See the staleTime on useGetWorkshop.
  const { data: workshop } = useGetWorkshop()

  const navigate = useNavigate()
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

  const go = (path: string) => {
    setMenuOpen(false)
    navigate(path)
  }

  /** One hamburger for both breakpoints: drawer on mobile, rail toggle on desktop. */
  const onHamburger = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) onToggleCollapse()
    else onMenu()
  }

  const active = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-brand-700 to-brand-800 shadow-[0_1px_12px_-2px_rgba(15,23,41,0.35)]">
      <div className="flex h-[68px] items-center gap-2 px-3 sm:gap-3 sm:px-5">
        {/* Sidebar toggle */}
        <button
          onClick={onHamburger}
          className={clsx(barButton, 'shrink-0')}
          aria-label={collapsed ? t('topbar.expand') : t('topbar.collapse')}
          title={collapsed ? t('topbar.expand') : t('topbar.collapse')}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Tenant company. The branch used to sit on a second line here as well,
            which said the same thing as the branch picker on the right of the
            same bar — and the picker is the one you can act on. */}
        <div className="hidden min-w-0 shrink-0 sm:block">
          {/* The workshop's own name, from GET /api/workshop. This was a
              constant in src/data/seed.ts reading "Demo Company", so every
              tenant's header claimed to be the demo and no setting could
              change it — there was nothing behind it to set.

              Falls back to the name on the user's own record, which the token
              already carries, so the header is right on first paint rather
              than flickering through a placeholder while the query lands. */}
          <p className="truncate text-base font-bold tracking-tight text-white">
            {workshop?.name || user?.workshop || ''}
          </p>
        </div>

        {/* Global search */}
        <div className="flex min-w-0 flex-1 justify-center">
          <GlobalSearch />
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* Branch + fiscal year (premium) */}
          <WorkspacePicker />

          {/* Language */}
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
              <div className="menu-panel right-0 top-full mt-2 w-52 p-1.5">
                <p className="menu-label">{t('topbar.language')}</p>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code)
                      setLangOpen(false)
                    }}
                    className={clsx(
                      'menu-item',
                      lang === l.code && 'bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700',
                    )}
                  >
                    <span className="flex w-6 shrink-0 justify-center">
                      <Flag code={l.flag} className="h-4 rounded-[2px] shadow-sm" />
                    </span>
                    <span className="flex-1 truncate">{l.long}</span>
                    {lang === l.code && <CheckIcon className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationMenu buttonClassName={barButton} />

          {/* Theme */}
          <button onClick={toggle} className={barButton} aria-label={t('topbar.theme')} title={t('topbar.theme')}>
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {/* Profile */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
              )}
              aria-label={t('topbar.myAccount')}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.name ?? t('topbar.myAccount')}
            >
              {/* The person's own initials, ringed. A generic silhouette in the
                  one place on the bar that is specifically *you* told nobody
                  which account they were signed in as. */}
              <span
                className={clsx(
                  'inline-flex rounded-full ring-2 transition',
                  menuOpen ? 'ring-white/80' : 'ring-white/35',
                )}
              >
                {user?.name ? (
                  <Avatar name={user.name} size="sm" color="bg-white/20" />
                ) : (
                  <UserCircleSolidIcon className="h-8 w-8 text-brand-200" />
                )}
              </span>
            </button>

            {menuOpen && (
              <div className="menu-panel right-0 top-full mt-2 w-64">
                {/* Identity block. Roomier than the rest of the panel on purpose
                    — it is a heading, not another row to click. */}
                <div className="flex items-center gap-3 bg-gradient-to-br from-brand-700 to-brand-800 px-3.5 py-3.5 text-white">
                  <span className="inline-flex shrink-0 rounded-full ring-2 ring-white/30">
                    <Avatar name={user?.name ?? 'User'} size="md" color="bg-white/20" />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-bold">{user?.name}</p>
                    <p className="mt-0.5 truncate text-[11px] text-brand-200">{user?.email}</p>
                    {user?.role && (
                      <span className="mt-1.5 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90">
                        {user.role}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-1.5">
                  <MenuItem icon={UserCircleIcon} label={t('topbar.myAccount')} onClick={() => go('/account')} />
                  <MenuItem icon={KeyIcon} label={t('topbar.changePassword')} onClick={() => go('/account?tab=security')} />
                </div>

                <div className="border-t border-ink-100 p-1.5">
                  <button
                    onClick={() => {
                      // Order matters. Clearing the session and navigating away
                      // first unmounts the dashboard, so nothing is left
                      // mounted to fire further requests. The revoke call then
                      // goes out on its own — and a failed one must never trap
                      // someone in a session they asked to leave.
                      const refreshToken = getRefreshToken()
                      signOut()
                      navigate('/login', { replace: true })
                      if (refreshToken) logoutMutation.mutate(refreshToken)
                    }}
                    className="menu-item text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    </span>
                    {t('topbar.signOut')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof UserCircleIcon; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="menu-item group">
      {/* The icon gets its own tinted tile so the labels line up on one column
          and the row has something to travel to on hover. */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      {label}
    </button>
  )
}
