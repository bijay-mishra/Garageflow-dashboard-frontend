import {
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import StatCard from '@/components/common/StatCard'
import { formatRs, formatRsCompact } from '@/lib/format'
import type { IDashboardSummary } from './dashboard-schema'

interface DashboardStatsProps {
  summary: IDashboardSummary
  /** Total vehicles on record — the denominator for the "in shop" meter. */
  vehicleCount: number
}

/** The four KPI cards across the top of the dashboard. */
export default function DashboardStats({ summary, vehicleCount }: DashboardStatsProps) {
  // Share of this month's billing still outstanding.
  const billed = summary.unpaidTotal + summary.revenueThisMonth
  const unpaidShare = billed ? Math.round((summary.unpaidTotal / billed) * 100) : 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Revenue this month"
        value={formatRsCompact(summary.revenueThisMonth)}
        delta={summary.revenueDeltaPct}
        deltaPeriod="last month"
        trend={summary.revenueTrend.map((p) => p.revenue)}
        footnote={`${formatRs(summary.revenueToday)} today`}
        icon={BanknotesIcon}
        tone="brand"
      />

      <StatCard
        label="Open job cards"
        value={String(summary.openJobs)}
        trend={summary.revenueTrend.map((p) => p.jobs)}
        footnote={`${summary.completedThisMonth} completed this month`}
        icon={ClipboardDocumentListIcon}
        tone="accent"
      />

      <StatCard
        label="Vehicles in shop"
        value={String(summary.vehiclesInShop)}
        meter={{
          // Guard the denominator: the vehicle list may not have loaded yet.
          value: summary.vehiclesInShop,
          max: Math.max(vehicleCount, summary.vehiclesInShop),
          caption: `of ${vehicleCount} vehicles on record`,
        }}
        footnote={`${summary.activeCustomers} active customers`}
        icon={TruckIcon}
        tone="violet"
      />

      <StatCard
        label="Outstanding dues"
        value={formatRsCompact(summary.unpaidTotal)}
        meter={{
          value: summary.unpaidTotal,
          max: billed,
          caption: `${unpaidShare}% of this month's billing unpaid`,
        }}
        footnote="Unpaid + partial invoices"
        icon={ExclamationTriangleIcon}
        tone="rose"
      />
    </div>
  )
}
