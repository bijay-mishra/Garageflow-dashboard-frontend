import { BuildingOffice2Icon } from '@heroicons/react/24/outline'
import type { ICompany } from '../superadmin-query'

/**
 * A company picker, for the console tabs that edit one company's lists.
 *
 * The operator belongs to no company, so fiscal years and branches have no
 * meaning until they name one. Making that an explicit, always-visible choice
 * rather than an implicit "whichever you looked at last" matters here more than
 * elsewhere: these tabs write, and writing to the wrong workshop is not
 * something the screen can undo for you.
 */
export default function CompanyScopedTab({
  companies,
  selected,
  onSelect,
  children,
}: {
  companies: ICompany[]
  selected: string
  onSelect: (code: string) => void
  children: React.ReactNode
}) {
  return (
    <>
      <section className="card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <BuildingOffice2Icon className="h-4 w-4 text-ink-400" />
            Company
          </span>

          <select
            className="input max-w-xs"
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">Choose a company…</option>
            {companies.map((c) => (
              <option key={c.companyCode} value={c.companyCode}>
                {c.name} ({c.companyCode})
              </option>
            ))}
          </select>

          {selected && (
            <span className="text-xs text-ink-400">
              Editing this workshop's own settings, exactly as their owner would see them.
            </span>
          )}
        </div>
      </section>

      {selected ? (
        children
      ) : (
        <section className="card flex flex-col items-center px-6 py-16 text-center">
          <BuildingOffice2Icon className="h-8 w-8 text-ink-300" />
          <p className="mt-2 text-sm font-semibold text-ink-600">Choose a company</p>
          <p className="mt-1 max-w-sm text-xs text-ink-400">
            These are a workshop's own lists, so there is nothing to show until you say whose.
          </p>
        </section>
      )}
    </>
  )
}
