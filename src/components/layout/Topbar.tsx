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
import { useWorkspace } from '@/context/WorkspaceContext'
import { company } from '@/data/seed'
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
  const { branch } = useWorkspace()
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

        {/* Tenant company + active branch */}
        <div className="hidden min-w-0 shrink-0 leading-tight sm:block">
          <p className="truncate text-sm font-bold text-white">{company.name}</p>
          {/* A workshop with no branches on record shows nothing here rather
              than a placeholder — this line *is* the branch, and inventing a
              name would put a location in the header that does not exist. */}
          {branch && <p className="truncate text-xs text-brand-200">{branch.name}</p>}
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
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={t('topbar.myAccount')}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.name ?? t('topbar.myAccount')}
            >
              <UserCircleSolidIcon className="h-9 w-9 text-brand-200" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-md border border-ink-100 bg-white shadow-soft animate-fade-in">
                <div className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-800 px-4 py-3.5 text-white">
                  <span className="inline-flex rounded-full ring-2 ring-white/40">
                    <Avatar name={user?.name ?? 'User'} size="md" color="bg-white/25" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user?.name}</p>
                    <p className="truncate text-xs text-brand-200">{user?.email}</p>
                  </div>
                </div>

                <div className="py-1">
                  <MenuItem icon={UserCircleIcon} label={t('topbar.myAccount')} onClick={() => go('/account')} />
                  <MenuItem icon={KeyIcon} label={t('topbar.changePassword')} onClick={() => go('/account?tab=security')} />
                </div>

                <div className="border-t border-ink-100 py-1">
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
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
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
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
      <Icon className="h-4 w-4 text-ink-400" />
      {label}
    </button>
  )
}
