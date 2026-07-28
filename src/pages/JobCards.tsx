import { useMemo, useState } from 'react'
import { ClipboardDocumentListIcon, ListBulletIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import SearchInput from '@/components/common/form/SearchInput'
import { EmptyState, ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import JobCardBoard from '@/components/JobCard/JobCardBoard'
import JobCardTable from '@/components/JobCard/JobCardTable'
import JobCardForm from '@/components/JobCard/JobCardForm'
import JobCardFilter, { type JobStatusFilter } from '@/components/JobCard/JobCardFilter'
import {
  useDeleteJobCard,
  useGetJobCardList,
  useGetJobCardListPaged,
  useUpdateJobCard,
} from '@/components/JobCard/jobcard-query'
import type { IJobCard, JobStatus } from '@/components/JobCard/jobcard-schema'
import { useSearchQuery } from '@/hooks/useSearchQuery'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'

export default function JobCards() {
  const [query, setQuery] = useSearchQuery()
  const search = useDebouncedValue(query)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [status, setStatus] = useState<JobStatusFilter>('All')
  const [modal, setModal] = useState<{ open: boolean; editing?: IJobCard }>({ open: false })

  // "All" means send no status param at all.
  const statusParam = status === 'All' ? undefined : status

  // The board groups every open job into columns, so it cannot be paged — it
  // fetches the lot. Only the list view pages against the server.
  const boardQuery = useGetJobCardList(view === 'board')

  const table = useTableState({ pageSize: 20 }, [search, statusParam])
  const listQuery = useGetJobCardListPaged(
    table.toQuery({ search, status: statusParam }),
    view === 'list',
  )

  const updateJobCard = useUpdateJobCard()
  const deleteJobCard = useDeleteJobCard()

  // The board filters in-browser; the list lets the server do it.
  const boardJobs = useMemo(() => {
    const q = search.trim().toLowerCase()
    const jobs = boardQuery.data ?? []
    if (!q) return jobs
    return jobs.filter(
      (j) =>
        j.id.toLowerCase().includes(q) ||
        j.vehicleLabel.toLowerCase().includes(q) ||
        j.vehiclePlate.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        j.mechanic.toLowerCase().includes(q),
    )
  }, [boardQuery.data, search])

  const changeStatus = (job: IJobCard, status: JobStatus) => updateJobCard.mutate({ id: job.id, status })
  const edit = (job: IJobCard) => setModal({ open: true, editing: job })
  const remove = (job: IJobCard) => deleteJobCard.mutate(job.id)

  const isError = view === 'board' ? boardQuery.isError : listQuery.isError
  if (isError) return <ErrorBlock />
  if (view === 'board' && boardQuery.isLoading) return <LoadingBlock label="Loading job cards…" />

  return (
    <div className="space-y-6">
      <StickyHeader title="Job Cards">
        <div className="flex rounded-md border border-ink-200 bg-white p-0.5">
          <button
            onClick={() => setView('board')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${view === 'board' ? 'bg-brand-600 text-white' : 'text-ink-500'}`}
          >
            <Squares2X2Icon className="h-4 w-4" /> Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${view === 'list' ? 'bg-brand-600 text-white' : 'text-ink-500'}`}
          >
            <ListBulletIcon className="h-4 w-4" /> List
          </button>
        </div>
        <button className="btn-primary" onClick={() => setModal({ open: true })}>
          New job card
        </button>
      </StickyHeader>

      {/* The board is not a table, so it gets a plain search box; the list view
          carries its search and status filter inside the table card, the way
          every other list page does. */}
      {view === 'board' && (
        <div className="max-w-md">
          <SearchInput value={query} onChange={setQuery} placeholder="Search job, plate, mechanic…" />
        </div>
      )}

      {view === 'board' ? (
        boardJobs.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={ClipboardDocumentListIcon}
              title="No job cards"
              message="Open a new job card to get started."
            />
          </div>
        ) : (
          <JobCardBoard data={boardJobs} onEdit={edit} onDelete={remove} onStatusChange={changeStatus} />
        )
      ) : (
        <div className="card overflow-hidden">
          <JobCardFilter
            search={query}
            onSearchChange={setQuery}
            status={status}
            onStatusChange={setStatus}
          />

          <JobCardTable
            data={listQuery.data?.list ?? []}
            total={listQuery.data?.count ?? 0}
            state={table.state}
            onStateChange={table.setState}
            loading={listQuery.isFetching}
            onEdit={edit}
            onDelete={remove}
            onStatusChange={changeStatus}
          />
        </div>
      )}

      {modal.open && <JobCardForm editing={modal.editing} onClose={() => setModal({ open: false })} />}
    </div>
  )
}
