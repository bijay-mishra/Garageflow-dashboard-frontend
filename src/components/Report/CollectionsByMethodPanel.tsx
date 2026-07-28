import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '@/components/common/Panel'
import { formatRs, formatRsCompact } from '@/lib/format'
import { METHOD_COLORS, type IReportSlice } from './report-schema'

interface CollectionsByMethodPanelProps {
  data: IReportSlice[]
}

/** Horizontal bars — method names are too long to sit under vertical bars. */
export default function CollectionsByMethodPanel({ data }: CollectionsByMethodPanelProps) {
  return (
    <Panel title="Collections by method" subtitle="Payments received">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-400">No payments recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <XAxis type="number" hide tickFormatter={(v) => formatRsCompact(v)} />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={92}
              tick={{ fontSize: 12, fill: '#606b8a' }}
            />
            <Tooltip
              formatter={(v: number) => [formatRs(v), 'Collected']}
              contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }}
              cursor={{ fill: 'rgba(37,99,235,0.06)' }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
              {data.map((slice) => (
                <Cell key={slice.name} fill={METHOD_COLORS[slice.name] ?? '#2563eb'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}
