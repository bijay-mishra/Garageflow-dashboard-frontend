import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BuildingOffice2Icon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/common/Badge'
import CompanyLogo from '@/components/common/CompanyLogo'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import CompanyForm from '@/components/SuperAdmin/CompanyForm'
import { useGetCompanies, useGetModules } from '@/components/SuperAdmin/superadmin-query'
import { formatDate } from '@/lib/format'

/**
 * The company register.
 *
 * A list only — every action on a company lives on its own page. The previous
 * version put suspend, module toggles and "sign in as" on each row, which meant
 * the most destructive controls on the platform were one stray click away while
 * scanning a table.
 */
export default function Companies() {
  const { data: companies = [], isLoading, isError } = useGetCompanies()
  const { data: modules = [] } = useGetModules()

  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  if (isLoading) return <LoadingBlock label="Loading companies…" />
  if (isError) return <ErrorBlock />

  const term = search.trim().toLowerCase()

  const visible = term
    ? companies.filter(
        (c) =>
          c.name.toLowerCase().includes(term) || c.companyCode.toLowerCase().includes(term),
      )
    : companies

  return (
    <>
      <ConsoleHeader
        title="Companies"
        subtitle={`${companies.length} on the platform · ${
          companies.filter((c) => c.isActive).length
        } active`}
      >
        <button className="btn-primary" onClick={() => setCreating(true)}>
          New company
        </button>
      </ConsoleHeader>

      <div className="p-5 lg:p-8">
        <div className="card overflow-hidden">
          <div className="border-b border-ink-100 p-4">
            <input
              className="input max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or code…"
            />
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <BuildingOffice2Icon className="h-8 w-8 text-ink-300" />
              <p className="mt-2 text-sm font-semibold text-ink-600">
                {term ? 'No company matches that' : 'No companies yet'}
              </p>
              <p className="mt-1 text-xs text-ink-400">
                {term ? 'Try the company code.' : 'Create the first one to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left">
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Customers</th>
                  <th className="px-4 py-3">Jobs</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3">Status</th>
                  {/* Named rather than blank: the edit and delete controls live
                      on the company's own page, and a row of names that happen
                      to be links is not a place people look for them. */}
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {visible.map((company) => (
                  <tr key={company.companyCode} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      {/* The mark leads the row. This is the one screen that
                          shows every company at once, and a page of codes is
                          faster to scan by logo than by word. */}
                      <span className="flex items-center gap-2.5">
                        <CompanyLogo url={company.logoUrl} name={company.name} size="sm" />
                        <span className="min-w-0">
                          <Link
                            to={`/superadmin/companies/${company.companyCode}`}
                            className="font-semibold text-ink-900 hover:text-brand-600"
                          >
                            {company.name}
                          </Link>
                          <code className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-500">
                            {company.companyCode}
                          </code>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{company.userCount}</td>
                    <td className="px-4 py-3 text-ink-600">{company.customerCount}</td>
                    <td className="px-4 py-3 text-ink-600">{company.jobCount}</td>
                    <td className="px-4 py-3 text-ink-600">{company.enabledModules.length}</td>
                    <td className="px-4 py-3 text-ink-500">
                      {company.lastActiveAt ? (
                        formatDate(company.lastActiveAt)
                      ) : (
                        <span className="text-xs text-ink-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {company.isActive ? (
                        <Badge tone="green">Active</Badge>
                      ) : (
                        <Badge tone="red">Suspended</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/superadmin/companies/${company.companyCode}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-semibold text-ink-600 transition hover:bg-ink-50 hover:text-brand-600"
                      >
                        <Cog6ToothIcon className="h-3.5 w-3.5" />
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      {creating && <CompanyForm modules={modules} onClose={() => setCreating(false)} />}
    </>
  )
}
