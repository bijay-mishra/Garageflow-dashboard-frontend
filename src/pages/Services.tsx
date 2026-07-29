import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import { ErrorBlock } from '@/components/common/loaders/States'
import ServiceTable from '@/components/Service/ServiceTable'
import ServiceForm from '@/components/Service/ServiceForm'
import ServiceFilter, {
  type ServiceCategoryFilter,
  type ServiceVehicleFilter,
} from '@/components/Service/ServiceFilter'
import {
  useDeleteService,
  useFetchAllServices,
  useGetServiceListPaged,
} from '@/components/Service/service-query'
import { appliesToLabel, type IService } from '@/components/Service/service-schema'
import { useSearchQuery } from '@/hooks/useSearchQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'
import { downloadCSV } from '@/lib/csv'

/**
 * The workshop's price list — everything it sells on top of parts and labour.
 *
 * Retired services are shown here and nowhere else: this is the only screen
 * that can bring one back, so hiding them would strand them.
 */
export default function Services() {
  const [query, setQuery] = useSearchQuery()
  const search = useDebouncedValue(query)
  const [category, setCategory] = useState<ServiceCategoryFilter>('All')
  const [vehicleType, setVehicleType] = useState<ServiceVehicleFilter>('All')

  // "All" means send no param at all.
  const categoryParam = category === 'All' ? undefined : category
  const vehicleTypeParam = vehicleType === 'All' ? undefined : vehicleType

  const table = useTableState({ pageSize: 20 }, [search, categoryParam, vehicleTypeParam])
  const { data, isFetching, isError } = useGetServiceListPaged(
    table.toQuery({ search, category: categoryParam, vehicleType: vehicleTypeParam }),
  )

  const deleteService = useDeleteService()
  const fetchAllServices = useFetchAllServices()
  const [modal, setModal] = useState<{ open: boolean; editing?: IService }>({ open: false })

  const exportCsv = async () => {
    const rows = await fetchAllServices({
      search,
      category: categoryParam,
      vehicleType: vehicleTypeParam,
    })

    downloadCSV(
      'services',
      ['ID', 'Service', 'Category', 'Price', 'Bay time (min)', 'Applies to', 'Bookable', 'Active', 'Used'],
      rows.map((s) => [
        s.id,
        s.name,
        s.category,
        s.price,
        s.durationMinutes,
        appliesToLabel(s.appliesTo),
        s.isBookable ? 'Yes' : 'No',
        s.isActive ? 'Yes' : 'No',
        s.timesUsed,
      ]),
    )
  }

  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Services">
        <button className="btn-ghost" onClick={exportCsv}>
          <ArrowDownTrayIcon className="h-4 w-4" /> Export
        </button>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          New service
        </button>
      </StickyHeader>

      <div className="card overflow-hidden">
        <ServiceFilter
          search={query}
          onSearchChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          vehicleType={vehicleType}
          onVehicleTypeChange={setVehicleType}
        />

        <ServiceTable
          data={data?.list ?? []}
          total={data?.count ?? 0}
          state={table.state}
          onStateChange={table.setState}
          loading={isFetching}
          onEdit={(service) => setModal({ open: true, editing: service })}
          onDelete={(service) => deleteService.mutate(service.id)}
        />
      </div>

      {modal.open && <ServiceForm editing={modal.editing} onClose={() => setModal({ open: false })} />}
    </div>
  )
}
