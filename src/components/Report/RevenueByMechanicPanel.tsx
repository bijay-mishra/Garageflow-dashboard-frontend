import Panel from '@/components/common/Panel'
import { formatRs } from '@/lib/format'
import type { IReportSlice } from './report-schema'

interface RevenueByMechanicPanelProps {
  data: IReportSlice[]
}

/** Ranked bar list — bars are scaled against the leader, not the total. */
export default function RevenueByMechanicPanel({ data }: RevenueByMechanicPanelProps) {
  const max = data[0]?.value || 1

  return (
    <Panel title="Revenue by mechanic" subtitle="All-time job value">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-400">No jobs recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {data.map((slice, index) => (
            <div key={slice.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-ink-700">
                  {index + 1}. {slice.name}
                </span>
                <span className="font-semibold text-ink-900">{formatRs(slice.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(slice.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
