import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Panel from '@/components/common/Panel'
import { formatRs, formatRsCompact } from '@/lib/format'
import type { IRevenuePoint } from '@/components/Dashboard/dashboard-schema'

/** Shared Recharts styling so both charts read as one system. */
const axisTick = { fontSize: 12, fill: '#808da6' }
const tooltipStyle = { borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }

interface MonthlyTrendChartsProps {
  data: IRevenuePoint[]
}

/** Revenue collected and jobs opened, month by month. */
export default function MonthlyTrendCharts({ data }: MonthlyTrendChartsProps) {
  return (
    <>
      <Panel title="Monthly revenue" subtitle="Last 6 months">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={axisTick}
              width={52}
              // The axis has no room for the currency prefix; the tooltip has it.
              tickFormatter={(v) => formatRsCompact(v).replace('Rs ', '')}
            />
            <Tooltip
              formatter={(v: number) => [formatRs(v), 'Revenue']}
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(37,99,235,0.06)' }}
            />
            <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Jobs opened" subtitle="Last 6 months">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
            <YAxis tickLine={false} axisLine={false} tick={axisTick} width={32} allowDecimals={false} />
            <Tooltip
              formatter={(v: number) => [`${v} jobs`, 'Jobs']}
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(245,158,11,0.08)' }}
            />
            <Bar dataKey="jobs" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  )
}
