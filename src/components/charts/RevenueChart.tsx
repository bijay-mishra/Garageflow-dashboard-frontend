import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatRsCompact } from '@/lib/format'

interface Point {
  label: string
  revenue: number
  jobs: number
}

export default function RevenueChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#808da6' }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: '#808da6' }}
          tickFormatter={(v) => formatRsCompact(v).replace('Rs ', '')}
          width={56}
        />
        <Tooltip
          formatter={(v: number) => [formatRsCompact(v), 'Revenue']}
          contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13, boxShadow: '0 4px 24px -8px rgba(15,23,41,0.15)' }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
