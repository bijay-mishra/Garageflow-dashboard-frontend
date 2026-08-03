import { BuildingOffice2Icon, UsersIcon, WrenchScrewdriverIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import { useGetCompanies, useGetImpersonations } from '@/components/SuperAdmin/superadmin-query'
import { formatDate } from '@/lib/format'

/**
 * The platform at a glance.
 *
 * Totals across every company, which is the one view no workshop can produce
 * for itself and the reason this console exists at all.
 */
export default function Overview() {
  const { data: companies = [], isLoading, isError } = useGetCompanies()
  const { data: audit = [] } = useGetImpersonations()

  if (isLoading) return <LoadingBlock label="Loading platform…" />
  if (isError) return <ErrorBlock />

  const total = (pick: (c: (typeof companies)[number]) => number) =>
    companies.reduce((sum, c) => sum + pick(c), 0)

  const suspended = companies.filter((c) => !c.isActive)
  const dormant = companies.filter((c) => !c.lastActiveAt)

  return (
    <>
      <ConsoleHeader title="Overview" subtitle="Every company on the platform" />

      <div className="space-y-6 p-5 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Companies" value={companies.length} icon={BuildingOffice2Icon} />
          <Tile label="Staff accounts" value={total((c) => c.userCount)} icon={UsersIcon} />
          <Tile label="Customers" value={total((c) => c.customerCount)} icon={UsersIcon} />
          <Tile label="Job cards" value={total((c) => c.jobCount)} icon={WrenchScrewdriverIcon} />
        </div>

        {(suspended.length > 0 || dormant.length > 0) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {suspended.length > 0 && (
              <section className="card p-5">
                <h2 className="text-sm font-bold text-ink-900">Suspended</h2>
                <p className="mt-0.5 text-xs text-ink-400">Nobody there can sign in.</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {suspended.map((c) => (
                    <li key={c.companyCode}>
                      <Link to={`/superadmin/companies/${c.companyCode}`} className="text-brand-600 hover:underline">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {dormant.length > 0 && (
              <section className="card p-5">
                <h2 className="text-sm font-bold text-ink-900">Never signed in</h2>
                <p className="mt-0.5 text-xs text-ink-400">
                  Created, but nobody has used them yet — worth a call.
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  {dormant.map((c) => (
                    <li key={c.companyCode}>
                      <Link to={`/superadmin/companies/${c.companyCode}`} className="text-brand-600 hover:underline">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-bold text-ink-900">Companies</h2>
            <Link to="/superadmin/companies" className="text-xs font-semibold text-brand-600">
              Manage
            </Link>
          </div>

          <ul className="divide-y divide-ink-100">
            {companies.slice(0, 6).map((c) => (
              <li key={c.companyCode} className="flex items-center gap-3 px-5 py-3">
                <Link
                  to={`/superadmin/companies/${c.companyCode}`}
                  className="text-sm font-semibold text-ink-900 hover:text-brand-600"
                >
                  {c.name}
                </Link>
                <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-500">
                  {c.companyCode}
                </code>
                <span className="ml-auto text-xs text-ink-400">
                  {c.customerCount} customers · {c.jobCount} jobs
                </span>
                {c.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-4">
            <ClipboardDocumentListIcon className="h-4 w-4 text-ink-400" />
            <h2 className="text-sm font-bold text-ink-900">Recent access</h2>
          </div>

          {audit.length === 0 ? (
            <p className="px-5 py-6 text-sm text-ink-400">No operator has entered a company yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {audit.slice(0, 5).map((a, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-3 px-5 py-3 text-sm">
                  <span className="font-medium text-ink-800">{a.userEmail}</span>
                  <span className="text-ink-400">entered</span>
                  <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-600">
                    {a.companyCode}
                  </code>
                  <span className="ml-auto text-xs text-ink-400">{formatDate(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function Tile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof UsersIcon
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-ink-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink-900">{value}</p>
    </div>
  )
}
