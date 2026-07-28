import { Link, useLocation } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'
import { flatNav, groupOf, EXTRA_PAGES } from '@/lib/navigation'
import { useLang } from '@/context/LanguageContext'

/** Prettify an unknown path segment: "job-cards" → "Job Cards". */
function prettify(segment: string): string {
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Route trail for the sticky page header — home icon, then one crumb per path
 * segment, the last one highlighted. Labels come from the nav definition so
 * they stay translated.
 */
export default function Breadcrumbs({ current }: { current?: string }) {
  const { pathname } = useLocation()
  const { t } = useLang()
  const segments = pathname.split('/').filter(Boolean)

  const labelFor = (segment: string) => {
    const match = [...flatNav(), ...EXTRA_PAGES].find((n) => n.to === `/${segment}`)
    return match ? t(match.labelKey) : prettify(segment)
  }

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Link to="/" className="shrink-0 text-ink-400 transition hover:text-brand-600" aria-label={t('nav.home')}>
        <HomeIcon className="h-4 w-4" />
      </Link>

      {segments.length === 0 ? (
        <>
          <span className="text-ink-300">/</span>
          <span className="truncate font-semibold text-brand-600">{current ?? t('nav.home')}</span>
        </>
      ) : (
        segments.map((segment, i) => {
          const last = i === segments.length - 1
          const to = `/${segments.slice(0, i + 1).join('/')}`
          // A page that lives under a sidebar group gets that group as a crumb,
          // so "/account" reads Home / Settings / My Account.
          const parent = i === 0 ? groupOf(to) : undefined
          return (
            <span key={to} className="flex min-w-0 items-center gap-1.5">
              {parent && (
                <>
                  <span className="text-ink-300">/</span>
                  <span className="truncate text-ink-500">{t(parent.labelKey)}</span>
                </>
              )}
              <span className="text-ink-300">/</span>
              {last ? (
                <span className="truncate font-semibold text-brand-600">{current ?? labelFor(segment)}</span>
              ) : (
                <Link to={to} className="truncate text-ink-500 transition hover:text-brand-600">
                  {labelFor(segment)}
                </Link>
              )}
            </span>
          )
        })
      )}
    </nav>
  )
}
