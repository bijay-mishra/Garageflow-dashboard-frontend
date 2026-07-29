import { BanknotesIcon, BuildingLibraryIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { formatRs } from '@/lib/format'
import type { ICollections } from './invoice-schema'

interface CollectionsPanelProps {
  data: ICollections | null
}

/**
 * What came in, split by how it arrived.
 *
 * The end-of-day question a workshop actually asks. Cash has to be counted in a
 * drawer; online and bank money is on somebody else's statement and has to be
 * reconciled against it. A single "collected" figure mixes the three and hides
 * the only distinction that matters when the numbers do not agree.
 *
 * Bars are proportions of the total rather than a chart: three values do not
 * need axes, and the eye reads relative width faster than it reads three
 * numbers.
 */
export default function CollectionsPanel({ data }: CollectionsPanelProps) {
  const total = data?.total ?? 0

  const rows = [
    { key: 'cash', label: 'Cash', hint: 'In the drawer', amount: data?.cash ?? 0, icon: BanknotesIcon, bar: 'bg-emerald-500', tone: 'text-emerald-700' },
    { key: 'online', label: 'Online', hint: 'eSewa, Khalti', amount: data?.online ?? 0, icon: DevicePhoneMobileIcon, bar: 'bg-brand-500', tone: 'text-brand-700' },
    { key: 'bank', label: 'Bank / card', hint: 'Transfer, terminal', amount: data?.bank ?? 0, icon: BuildingLibraryIcon, bar: 'bg-violet-500', tone: 'text-violet-700' },
  ]

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-ink-900">Collected by channel</h2>
        <span className="text-xs text-ink-400">
          {formatRs(total)} received
          {/* Attempts in flight are a count, never an amount. A customer halfway
              through eSewa has paid nothing, and showing their bill as money
              received is how a shop's books stop balancing. */}
          {(data?.pendingCount ?? 0) > 0 && (
            <> · {data!.pendingCount} awaiting confirmation</>
          )}
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map((row) => {
          const share = total > 0 ? (row.amount / total) * 100 : 0

          return (
            <div key={row.key}>
              <div className="mb-1 flex items-center gap-2">
                <row.icon className={clsx('h-4 w-4 shrink-0', row.tone)} />
                <span className="text-xs font-semibold text-ink-700">{row.label}</span>
                <span className="text-xs text-ink-400">{row.hint}</span>
                <span className="ml-auto text-xs font-bold tabular-nums text-ink-900">
                  {formatRs(row.amount)}
                </span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-400">
                  {share.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div className={clsx('h-full rounded-full transition-all', row.bar)} style={{ width: `${share}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
