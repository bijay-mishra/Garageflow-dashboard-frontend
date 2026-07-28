import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid'
import type { SortState } from '@/hooks/useSort'

interface SortableThProps<K extends string> {
  label: string
  sortKey: K
  sort: SortState<K> | null
  onSort: (key: K) => void
  align?: 'left' | 'right' | 'center'
  className?: string
}

/** A clickable table header cell that drives `useSort`. */
export default function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
  className = '',
}: SortableThProps<K>) {
  const active = sort?.key === sortKey
  const alignCls = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <th className={`px-3 py-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
        className={`group flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-wider transition ${alignCls} ${
          active ? 'text-brand-600' : 'text-ink-400 hover:text-ink-600'
        }`}
      >
        <span>{label}</span>
        {active ? (
          sort!.dir === 'asc' ? (
            <ChevronUpIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronDownIcon className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronUpDownIcon className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
        )}
      </button>
    </th>
  )
}
