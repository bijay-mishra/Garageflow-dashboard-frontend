import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { IJobStatusCount } from '@/components/Dashboard/dashboard-schema'
import { jobStatusColor } from '@/lib/status'

export default function JobStatusChart({ data }: { data: IJobStatusCount[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.status} fill={jobStatusColor[d.status]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, n) => [`${v} jobs`, n as string]}
              contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink-900">{total}</span>
          <span className="text-xs text-ink-400">total jobs</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: jobStatusColor[d.status] }} />
            <span className="flex-1 text-ink-600">{d.status}</span>
            <span className="font-semibold text-ink-900">{d.count}</span>
            <span className="w-10 text-right text-xs text-ink-400">
              {total ? Math.round((d.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
