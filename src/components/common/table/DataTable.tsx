import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import SortableTh from './SortableTh'
import Pagination from './Pagination'
import { EmptyState, LoadingBlock, Spinner } from '../loaders/States'
import { sortItems, type SortDir, type SortValue } from '@/hooks/useSort'

export interface Column<T> {
  /** Stable key — also used as the sort key sent to the API. */
  key: string
  header: string
  /** Cell content. */
  render: (row: T) => ReactNode
  /** Return a value here to make the column sortable. */
  sortValue?: (row: T) => SortValue
  align?: 'left' | 'right' | 'center'
  cellClassName?: string
  headerClassName?: string
}

export interface TableSort {
  key: string
  dir: SortDir
}

/** The full query state a server-side table needs — page, size and sort. */
export interface TableState {
  page: number
  pageSize: number
  sort: TableSort | null
}

export const DEFAULT_PAGE_SIZES = [20, 40, 100, 200]

/**
 * The props a server-paged table needs from its page. Feature tables spread
 * this straight onto `DataTable`, so a page wires paging once and every table
 * behaves the same.
 */
export interface ServerTableProps {
  /** Total rows across all pages — `count` from the API. */
  total: number
  state: TableState
  onStateChange: (next: TableState) => void
  loading?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  showIndex?: boolean
  indexLabel?: string
  itemLabel?: string
  empty?: { icon: ComponentType<{ className?: string }>; title: string; message?: string }
  onRowClick?: (row: T) => void

  // ── Pagination config (both modes) ──
  paginated?: boolean
  pageSizeOptions?: number[]
  initialPageSize?: number
  initialSort?: TableSort

  // ── Server / API mode ──────────────────────────────────────────────────────
  // Turn this on when `data` is a single page fetched from your .NET API. The
  // table then stops slicing/sorting locally and instead reports every page,
  // size and sort change up through `onStateChange` so you can refetch. Combine
  // with your own filter params (search, status, …) in the query key.
  serverMode?: boolean
  /** Total row count across all pages (server mode) — drives the page count. */
  total?: number
  /** Controlled query state (server mode). */
  state?: TableState
  onStateChange?: (next: TableState) => void
  /** Show a loading overlay while the current page is being fetched. */
  loading?: boolean
  /** Max height of the scroll area — the header row stays pinned above it. */
  tableHeight?: string
  /** Set false to let the page scroll instead of the table body. */
  stickyHeader?: boolean
}

const alignClass = (a?: 'left' | 'right' | 'center') =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  showIndex = true,
  indexLabel = 'S.N.',
  itemLabel = 'items',
  empty,
  onRowClick,
  paginated = true,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  initialPageSize,
  initialSort,
  serverMode = false,
  total: totalProp,
  state: controlledState,
  onStateChange,
  loading = false,
  tableHeight = '62vh',
  stickyHeader = true,
}: DataTableProps<T>) {
  const accessors = useMemo(
    () =>
      columns.reduce<Record<string, (row: T) => SortValue>>((acc, col) => {
        if (col.sortValue) acc[col.key] = col.sortValue
        return acc
      }, {}),
    [columns],
  )

  // State is controlled by the parent in server mode, internal otherwise.
  const [internal, setInternal] = useState<TableState>({
    page: 1,
    pageSize: initialPageSize ?? pageSizeOptions[0] ?? 20,
    sort: initialSort ?? null,
  })
  const state = serverMode && controlledState ? controlledState : internal
  const setState = (next: TableState) => (serverMode ? onStateChange?.(next) : setInternal(next))

  // Client mode: reset to page 1 whenever the (filtered) data set changes.
  useEffect(() => {
    if (!serverMode) setInternal((s) => ({ ...s, page: 1 }))
  }, [data, serverMode])

  // ── Derive the rows to render ──
  const sorted = useMemo(() => {
    if (serverMode || !state.sort) return data
    const acc = accessors[state.sort.key]
    return acc ? sortItems(data, acc, state.sort.dir) : data
  }, [data, accessors, state.sort, serverMode])

  const total = serverMode ? totalProp ?? 0 : sorted.length
  const pageCount = paginated ? Math.max(1, Math.ceil(total / state.pageSize)) : 1
  const safePage = Math.min(state.page, pageCount)
  const offset = paginated ? (safePage - 1) * state.pageSize : 0
  const rows = serverMode || !paginated ? sorted : sorted.slice(offset, offset + state.pageSize)

  // ── Handlers ──
  const goToPage = (p: number) => setState({ ...state, page: p })
  const changePageSize = (size: number) => setState({ ...state, pageSize: size, page: 1 })
  const changeSort = (key: string) => {
    const dir: SortDir = state.sort?.key === key && state.sort.dir === 'asc' ? 'desc' : 'asc'
    setState({ ...state, sort: { key, dir }, page: 1 })
  }

  // Full-panel loader on first load (server mode, no rows yet).
  if (loading && rows.length === 0) return <LoadingBlock />

  if (total === 0 && !loading && empty) {
    return <EmptyState icon={empty.icon} title={empty.title} message={empty.message} />
  }

  const colSpan = columns.length + (showIndex ? 1 : 0)

  return (
    <>
      <div
        className="relative overflow-auto"
        style={stickyHeader ? { maxHeight: tableHeight } : undefined}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-[#0f1626]/60">
            <Spinner className="h-6 w-6 text-brand-500" />
          </div>
        )}
        <table className="w-full text-sm">
          {/* The header row is pinned to the top of the scroll box, so columns
              stay labelled however far down the list you are. */}
          <thead className={stickyHeader ? 'sticky top-0 z-10' : undefined}>
            <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              {showIndex && <th className="px-3 py-2.5 text-right tabular-nums">{indexLabel}</th>}
              {columns.map((col) =>
                col.sortValue ? (
                  <SortableTh key={col.key} label={col.header} sortKey={col.key} sort={state.sort} onSort={changeSort} align={col.align} className={col.headerClassName} />
                ) : (
                  <th key={col.key} className={`px-3 py-2.5 ${alignClass(col.align)} ${col.headerClassName ?? ''}`}>
                    {col.header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-10 text-center text-sm text-ink-400">
                  No results.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`hover:bg-ink-50/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {/* Same weight and colour as every other cell: the row number
                      is data, not a label, and having it lighter than the rest
                      was one more thing making the table look striped. */}
                  {showIndex && <td className="px-3 py-2 text-right tabular-nums text-ink-700">{offset + i + 1}</td>}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2 ${alignClass(col.align)} ${col.cellClassName ?? ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginated && (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          total={total}
          pageSize={state.pageSize}
          onChange={goToPage}
          label={itemLabel}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={changePageSize}
        />
      )}
    </>
  )
}
