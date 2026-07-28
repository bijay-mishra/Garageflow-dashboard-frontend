import {
  BanknotesIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import StatCard from '@/components/common/StatCard'
import { formatRs, formatRsCompact } from '@/lib/format'
import type { IDashboardSummary } from '@/components/Dashboard/dashboard-schema'

interface ReportStatsProps {
  summary: IDashboardSummary
  averageInvoice: number
}

/** Headline figures across the top of the reports page. */
export default function ReportStats({ summary, averageInvoice }: ReportStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Revenue (month)"
        value={formatRsCompact(summary.revenueThisMonth)}
        delta={summary.revenueDeltaPct}
        icon={BanknotesIcon}
        tone="brand"
      />
      <StatCard label="Avg. invoice value" value={formatRs(averageInvoice)} icon={CalendarDaysIcon} tone="accent" />
      <StatCard
        label="Jobs completed (month)"
        value={String(summary.completedThisMonth)}
        icon={WrenchScrewdriverIcon}
        tone="violet"
      />
      <StatCard
        label="Active customers"
        value={String(summary.activeCustomers)}
        icon={UserGroupIcon}
        tone="emerald"
      />
    </div>
  )
}
