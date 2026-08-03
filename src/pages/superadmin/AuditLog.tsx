import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import { useGetImpersonations } from '@/components/SuperAdmin/superadmin-query'
import { formatDate } from '@/lib/format'

/**
 * Every time an operator has entered a company.
 *
 * The counterweight to impersonation existing at all: one person can open any
 * workshop's books, and the workshop cannot see it happening. That is only
 * defensible if the record is complete and nobody can quietly skip it — the row
 * is written in the same transaction that mints the token.
 */
export default function AuditLog() {
  const { data: audit = [], isLoading, isError } = useGetImpersonations()

  if (isLoading) return <LoadingBlock label="Loading access log…" />
  if (isError) return <ErrorBlock />

  return (
    <>
      <ConsoleHeader
        title="Access log"
        subtitle="Operator sign-ins to a company, most recent first"
      />

      <div className="p-5 lg:p-8">
        <div className="card overflow-hidden">
          {audit.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-ink-400">
              Nobody has signed in as a company yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left">
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Operator</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">When</th>
                  <th className="px-5 py-3">Reason</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {audit.map((a, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-medium text-ink-800">{a.userEmail}</td>
                    <td className="px-5 py-3">
                      <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-600">
                        {a.companyCode}
                      </code>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(a.at)}</td>
                    <td className="px-5 py-3 text-ink-500">
                      {a.reason || <span className="text-xs text-ink-300">None given</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
