import { Link } from 'react-router-dom'
import type { ICompany } from '../superadmin-query'

/**
 * The module catalogue, and how widely each is switched on.
 *
 * Read-only. A module is a thing the product can do — adding one means writing
 * it — so this cannot create them. Turning one on for a company happens on that
 * company's page, where you can see whose data you are changing.
 */
export default function ModulesTab({
  modules,
  companies,
}: {
  modules: string[]
  companies: ICompany[]
}) {
  const always = ['customers', 'vehicles', 'job cards']

  return (
    <>
      <section className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Always included</h2>
        <p className="mt-0.5 text-xs text-ink-400">
          The product itself. A workshop with these switched off has bought nothing, so they are
          not configurable.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {always.map((name) => (
            <span
              key={name}
              className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-500"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-bold text-ink-900">Optional modules</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Switched on per company from that company&rsquo;s page.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left">
              <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3">Companies using it</th>
                <th className="px-5 py-3">Take-up</th>
                <th className="px-5 py-3">Who</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-100">
              {modules.map((name) => {
                const users = companies.filter((c) => c.enabledModules.includes(name))
                const pct = companies.length
                  ? Math.round((users.length / companies.length) * 100)
                  : 0

                return (
                  <tr key={name}>
                    <td className="px-5 py-3 font-semibold text-ink-900">{name}</td>
                    <td className="px-5 py-3 text-ink-600">
                      {users.length} of {companies.length}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-ink-100">
                          <div
                            className="h-full rounded-full bg-brand-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink-400">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {users.length === 0 ? (
                        <span className="text-xs text-ink-400">Nobody yet</span>
                      ) : (
                        <span className="flex flex-wrap gap-1.5">
                          {users.map((c) => (
                            <Link
                              key={c.companyCode}
                              to={`/superadmin/companies/${c.companyCode}`}
                              className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700"
                            >
                              {c.companyCode}
                            </Link>
                          ))}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
