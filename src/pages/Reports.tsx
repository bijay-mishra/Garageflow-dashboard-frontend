import { useMemo } from 'react'
import StickyHeader from '@/components/common/headers/StickyHeader'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import ReportStats from '@/components/Report/ReportStats'
import MonthlyTrendCharts from '@/components/Report/MonthlyTrendCharts'
import RevenueByMechanicPanel from '@/components/Report/RevenueByMechanicPanel'
import CollectionsByMethodPanel from '@/components/Report/CollectionsByMethodPanel'
import TopCustomersPanel from '@/components/Report/TopCustomersPanel'
import {
  averageInvoiceValue,
  collectionsByMethod,
  revenueByMechanic,
  topCustomers,
} from '@/components/Report/report-schema'
import { useGetDashboardSummary } from '@/components/Dashboard/dashboard-query'
import { useGetJobCardList } from '@/components/JobCard/jobcard-query'
import { useGetInvoiceList } from '@/components/Invoice/invoice-query'

export default function Reports() {
  const { data: summary, isLoading, isError } = useGetDashboardSummary()
  const { data: jobs = [] } = useGetJobCardList()
  const { data: invoices = [] } = useGetInvoiceList()

  const byMechanic = useMemo(() => revenueByMechanic(jobs), [jobs])
  const byMethod = useMemo(() => collectionsByMethod(invoices), [invoices])
  const customers = useMemo(() => topCustomers(invoices), [invoices])
  const averageInvoice = useMemo(() => averageInvoiceValue(invoices), [invoices])

  if (isLoading) return <LoadingBlock label="Building reports…" />
  if (isError || !summary) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Reports" />

      <ReportStats summary={summary} averageInvoice={averageInvoice} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MonthlyTrendCharts data={summary.revenueTrend} />
        <RevenueByMechanicPanel data={byMechanic} />
        <CollectionsByMethodPanel data={byMethod} />
      </div>

      <TopCustomersPanel data={customers} />
    </div>
  )
}
