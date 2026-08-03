import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  BuildingOffice2Icon,
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightEndOnRectangleIcon,
  ChevronDownIcon,
  CheckIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import Logo from '@/components/common/Logo'
import Flag from '@/components/common/Flag'
import { Spinner } from '@/components/common/loaders/States'
import { useAuth } from '@/context/AuthContext'
import { useLogin } from '@/components/Auth/auth-query'
import { loginFormSchema, loginInitialValues } from '@/components/Auth/auth-schema'
import { useLang } from '@/context/LanguageContext'
import { LANGS } from '@/lib/i18n'
import { support } from '@/lib/runtimeConfig'
import { workshopInfo } from '@/data/seed'

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const { phone1, phone2 } = support()
  const loginMutation = useLogin()

  // Prefilled with the seeded demo account — see loginInitialValues.
  const [companyCode, setCompanyCode] = useState(loginInitialValues.companyCode)
  const [email, setEmail] = useState(loginInitialValues.email)
  const [password, setPassword] = useState(loginInitialValues.password)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const busy = loginMutation.isPending

  // Where the user was headed before ProtectedRoute sent them here.
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const values = { companyCode: companyCode.trim(), email: email.trim(), password }

    if (!(await loginFormSchema.isValid(values))) {
      setError(t('login.required'))
      return
    }

    setError('')

    try {
      const res = await loginMutation.mutateAsync(values)
      const result = res?.data?.data

      if (!result) {
        setError(res?.data?.message ?? t('login.required'))
        return
      }

      signIn({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        mustSetPassword: result.mustSetPassword,
      })

      // A handed-over password gets one screen and nothing else. No "back where
      // I was" applies — this is a first sign-in, so there is nowhere to return.
      navigate(result.mustSetPassword ? '/set-password' : redirectTo, { replace: true })
    } catch (err) {
      // The API's own wording — "Company code, email or password is incorrect."
      setError(err instanceof Error ? err.message : t('login.required'))
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 xl:grid-cols-[1.08fr_1fr]">
      {/* ── Left — brand & product shot ──────────────────────────────────── */}
      <aside className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-ink-900 via-brand-900 to-ink-950 px-10 py-10 text-white lg:flex xl:px-16">
        <ConcentricRings />

        <div className="relative z-10 flex items-center gap-2.5">
          <Logo variant="mark" className="h-9 w-9" />
          <span className="text-sm font-bold">{workshopInfo.name}</span>
        </div>

        <div className="relative z-10 mt-auto max-w-md">
          <h2 className="text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">
            {t('login.headlineA')}
            <br />
            {t('login.headlineB')}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">{t('login.tagline')}</p>
        </div>

        <DeviceMockup />

        <p className="relative z-10 mt-auto text-xs text-brand-200/70">
          © {new Date().getFullYear()} {workshopInfo.legalName}
        </p>
      </aside>

      {/* ── Right — the form ─────────────────────────────────────────────── */}
      <main className="flex flex-col bg-white px-6 py-6 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-3">
            <a
              href={`tel:${phone1.replace(/\s/g, '')}`}
              className="hidden items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-brand-600 sm:flex"
            >
              <PhoneIcon className="h-4 w-4" />
              {t('login.contactUs')}
            </a>
            <LanguagePicker />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">{t('login.title')}</h1>
          <p className="mt-1.5 text-sm text-ink-500">{t('login.subtitle')}</p>

          <form onSubmit={submit} className="mt-7 space-y-3" noValidate>
              {error && (
                <p role="alert" className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600">
                  {error}
                </p>
              )}

              <PillInput
                id="company"
                label={t('login.companyCode')}
                icon={BuildingOffice2Icon}
                value={companyCode}
                onChange={(v) => setCompanyCode(v.toUpperCase())}
                placeholder={t('login.companyCode')}
                autoComplete="organization"
                autoFocus
                invalid={!!error}
                inputClassName="uppercase tracking-wider"
              />

              <PillInput
                id="email"
                label={t('login.email')}
                icon={UserIcon}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={t('login.email')}
                autoComplete="email"
                invalid={!!error}
              />

              <div>
                <label htmlFor="password" className="sr-only">
                  {t('login.password')}
                </label>
                <div className="group relative">
                  <LockClosedIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition group-focus-within:text-brand-600" />
                  <input
                    id="password"
                    className={clsx(PILL_CLASS, 'pr-11')}
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!error}
                    placeholder={t('login.password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 transition hover:text-ink-700"
                    aria-label={show ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Link
                to="/forgot-password"
                className="block pl-1 pt-0.5 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
              >
                {t('login.forgot')}
              </Link>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 text-sm font-bold text-white shadow-glow transition hover:from-brand-700 hover:to-ink-900 active:scale-[0.99] disabled:opacity-60"
              >
                {busy ? <Spinner /> : <ArrowRightEndOnRectangleIcon className="h-5 w-5" />}
                {t('login.signIn')}
              </button>
          </form>
        </div>

        {/* Footer — support lines */}
        <div className="mx-auto flex w-full max-w-sm flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-ink-100 pt-4">
          <SupportLink label={t('login.support1')} value={phone1} />
          <SupportLink label={t('login.support2')} value={phone2} />
          <p className="w-full text-center text-[11px] text-ink-400 lg:hidden">
            © {new Date().getFullYear()} {workshopInfo.legalName}
          </p>
        </div>
      </main>
    </div>
  )
}

// ── Form primitives ──────────────────────────────────────────────────────────

const PILL_CLASS =
  'h-12 w-full rounded-full border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 outline-none transition ' +
  'placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

function PillInput({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  autoFocus,
  invalid,
  inputClassName,
}: {
  id: string
  label: string
  icon: typeof UserIcon
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  autoFocus?: boolean
  invalid?: boolean
  inputClassName?: string
}) {
  return (
    <div>
      {/* The placeholder carries the label visually; this keeps it for screen readers. */}
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 transition group-focus-within:text-brand-600" />
        <input
          id={id}
          className={clsx(PILL_CLASS, inputClassName)}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={invalid}
        />
      </div>
    </div>
  )
}

function SupportLink({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <a
      href={`tel:${value.replace(/\s/g, '')}`}
      title={label}
      className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-500 transition hover:text-brand-600"
    >
      <PhoneIcon className="h-3.5 w-3.5" />
      {value}
    </a>
  )
}

/** Flag + language name, opening a menu of the available languages. */
function LanguagePicker() {
  const { lang, setLang, t } = useLang()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const active = LANGS.find((l) => l.code === lang) ?? LANGS[0]

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('topbar.language')}
        className="flex items-center gap-1.5 rounded-full border border-ink-200 px-2.5 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        <Flag code={active.flag} className="h-3.5" />
        {active.long}
        <ChevronDownIcon className={clsx('h-3 w-3 text-ink-400 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-40 mt-2 w-40 overflow-hidden rounded-lg border border-ink-100 bg-white p-1 shadow-soft animate-fade-in"
        >
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={lang === l.code}
                onClick={() => {
                  setLang(l.code)
                  setOpen(false)
                }}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-xs font-semibold transition',
                  lang === l.code ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
                )}
              >
                <span className="flex w-6 justify-center">
                  <Flag code={l.flag} className="h-4" />
                </span>
                <span className="flex-1">{l.long}</span>
                {lang === l.code && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Left-panel decoration ────────────────────────────────────────────────────

function ConcentricRings() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 400 400" className="absolute left-1/2 top-[42%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 text-white">
        {[190, 150, 110, 70].map((r, i) => (
          <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="currentColor" strokeWidth="1" opacity={0.07 - i * 0.012} />
        ))}
      </svg>
      <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="absolute -right-10 bottom-10 h-56 w-56 rounded-full bg-accent-400/15 blur-3xl" />
    </div>
  )
}

/**
 * A phone showing the GarageFlow dashboard — the product shot for the brand
 * panel. Drawn rather than photographed so it ships no assets and stays sharp.
 */
function DeviceMockup() {
  const bars = [42, 66, 34, 78, 52, 88, 61]

  return (
    <div aria-hidden className="relative z-10 my-8 flex justify-center">
      {/* Glow so the device sits in light rather than on a flat panel */}
      <div className="absolute inset-x-8 top-10 h-64 rounded-full bg-brand-500/25 blur-3xl" />

      <div className="relative w-[17.5rem] rotate-[-5deg]">
        <div className="rounded-[2.2rem] bg-ink-950 p-2.5 shadow-[0_45px_80px_-25px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
          <div className="overflow-hidden rounded-[1.8rem] bg-white">
            {/* App bar */}
            <div className="flex items-center justify-between bg-gradient-to-r from-brand-700 to-brand-800 px-4 py-3 text-white">
              <span className="text-[11px] font-bold">GarageFlow</span>
              <span className="flex items-center gap-1 text-[9px] text-brand-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            <div className="space-y-3.5 p-4">
              {/* Hero figure */}
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-ink-400">Revenue this month</p>
                <div className="mt-1 flex items-end gap-2">
                  <p className="text-2xl font-bold leading-none text-ink-900">Rs 34.8K</p>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">+12.4%</span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex h-20 items-end gap-1.5">
                {bars.map((h, i) => (
                  <span
                    key={i}
                    className={clsx('w-full rounded-t-md', i === bars.length - 2 ? 'bg-brand-600' : 'bg-brand-200')}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              {/* KPI tiles */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: 'Open jobs', v: '12' },
                  { k: 'In shop', v: '5' },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg bg-ink-50 px-2.5 py-2">
                    <p className="text-[8px] font-semibold uppercase tracking-wide text-ink-400">{s.k}</p>
                    <p className="mt-0.5 text-base font-bold leading-none text-ink-900">{s.v}</p>
                  </div>
                ))}
              </div>

              {/* List rows */}
              <div className="space-y-2 pt-0.5">
                {[80, 62].map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-6 w-6 shrink-0 rounded-md bg-brand-100" />
                    <span className="flex-1 space-y-1">
                      <span className="block h-1.5 rounded-full bg-ink-200" style={{ width: `${w}%` }} />
                      <span className="block h-1.5 w-1/3 rounded-full bg-ink-100" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
