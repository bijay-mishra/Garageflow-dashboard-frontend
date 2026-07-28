import type { ReactNode } from 'react'
import SearchInput from '@/components/common/form/SearchInput'

interface TableFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  /** `FilterDropdown`s, laid out at the right edge on the same line. */
  children?: ReactNode
}

/**
 * The strip above a table: search on the left, filters pushed to the right.
 *
 * Every list page uses this so the controls sit in the same place on each of
 * them. On a narrow screen it stacks — search first, then the filters — rather
 * than squeezing everything onto one cramped line.
 */
export default function TableFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
}: TableFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder} />

      {children && <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">{children}</div>}
    </div>
  )
}
