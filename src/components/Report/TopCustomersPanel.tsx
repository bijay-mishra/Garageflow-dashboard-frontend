import Panel from '@/components/common/Panel'
import { formatRs } from '@/lib/format'
import type { IReportSlice } from './report-schema'

interface TopCustomersPanelProps {
  data: IReportSlice[]
}

export default function TopCustomersPanel({ data }: TopCustomersPanelProps) {
  // Share is of the shown customers, not of all billing — the caption says so.
  const shownTotal = data.reduce((sum, slice) => sum + slice.value, 0) || 1

  return (
    <Panel title="Top customers" subtitle="By lifetime billed value">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-400">No invoices raised yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2 text-right">Billed</th>
                <th className="px-2 py-2">Share of top {data.length}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {data.map((slice, index) => {
                const share = (slice.value / shownTotal) * 100
                return (
                  <tr key={slice.name}>
                    <td className="px-2 py-2.5 font-bold text-ink-400">{index + 1}</td>
                    <td className="px-2 py-2.5 font-medium text-ink-800">{slice.name}</td>
                    <td className="px-2 py-2.5 text-right font-semibold text-ink-900">{formatRs(slice.value)}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                          <div className="h-full rounded-full bg-accent-500" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-ink-400">{Math.round(share)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
