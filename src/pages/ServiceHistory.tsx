import { useMemo, useState } from 'react'
import { ArrowDownTrayIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import SearchInput from '@/components/common/form/SearchInput'
import { EmptyState, ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import ServiceHistoryTimeline from '@/components/ServiceHistory/ServiceHistoryTimeline'
import { filterServiceHistory } from '@/components/ServiceHistory/service-history-schema'
import { useGetJobCardList } from '@/components/JobCard/jobcard-query'
import { downloadCSV } from '@/lib/csv'

export default function ServiceHistory() {
  const { data: jobs = [], isLoading, isError } = useGetJobCardList()
  const [query, setQuery] = useState('')

  const history = useMemo(() => filterServiceHistory(jobs, query), [jobs, query])

  const exportCsv = () =>
    downloadCSV(
      'service-history',
      ['Job', 'Date', 'Vehicle', 'Plate', 'Customer', 'Odometer', 'Mechanic', 'Total'],
      history.map((j) => [j.id, j.completedAt ?? '', j.vehicleLabel, j.vehiclePlate, j.customerName, j.odometer, j.mechanic, j.total]),
    )

  if (isLoading) return <LoadingBlock label="Loading service history…" />
  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Service History">
        <button className="btn-ghost" onClick={exportCsv}>
          <ArrowDownTrayIcon className="h-4 w-4" /> Export
        </button>
      </StickyHeader>

      <div className="max-w-md">
        <SearchInput value={query} onChange={setQuery} placeholder="Search vehicle, plate, customer…" />
      </div>

      {history.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={WrenchScrewdriverIcon}
            title="No service history"
            message="Completed jobs will appear here."
          />
        </div>
      ) : (
        <ServiceHistoryTimeline jobs={history} />
      )}
    </div>
  )
}
