import clsx from 'clsx'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  label?: string
  /** When provided, renders a rows-per-page dropdown on the right. */
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

function pageRange(page: number, pageCount: number): (number | '…')[] {
  const out: (number | '…')[] = []
  const from = Math.max(1, page - 1)
  const to = Math.min(pageCount, page + 1)
  if (from > 1) {
    out.push(1)
    if (from > 2) out.push('…')
  }
  for (let i = from; i <= to; i++) out.push(i)
  if (to < pageCount) {
    if (to < pageCount - 1) out.push('…')
    out.push(pageCount)
  }
  return out
}

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
  label = 'items',
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  if (total === 0) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  const showSizes = !!pageSizeOptions?.length && !!onPageSizeChange

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500 sm:grid-cols-3">
      {/* Left — summary */}
      <span className="text-center sm:text-left">
        Showing <span className="font-semibold text-ink-700">{start}–{end}</span> of{' '}
        <span className="font-semibold text-ink-700">{total}</span> {label}
      </span>

      {/* Center — page numbers */}
      <div className="flex items-center justify-center gap-1">
        {pageCount > 1 && (
          <>
            <button
              onClick={() => onChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-ink-200 p-1.5 text-ink-500 hover:bg-ink-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            {pageRange(page, pageCount).map((p, i) =>
              p === '…' ? (
                <span key={`e${i}`} className="px-1.5 text-ink-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onChange(p)}
                  className={clsx(
                    'min-w-[2rem] rounded-lg border px-2 py-1 font-semibold',
                    p === page ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 text-ink-600 hover:bg-ink-50',
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => onChange(Math.min(pageCount, page + 1))}
              disabled={page === pageCount}
              className="rounded-lg border border-ink-200 p-1.5 text-ink-500 hover:bg-ink-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Right — rows per page */}
      <div className="flex items-center justify-center gap-2 sm:justify-end">
        {showSizes && (
          <label className="flex items-center gap-2">
            <span className="text-ink-400">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange!(Number(e.target.value))}
              className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs font-semibold text-ink-700 outline-none focus:border-brand-400"
              aria-label="Rows per page"
            >
              {pageSizeOptions!.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  )
}
