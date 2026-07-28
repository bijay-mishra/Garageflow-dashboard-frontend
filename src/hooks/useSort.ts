import { useMemo, useRef, useState } from 'react'

export type SortDir = 'asc' | 'desc'
export interface SortState<K extends string> {
  key: K
  dir: SortDir
}

/** Value a column sorts on. Nulls/undefined always sort to the end. */
export type SortValue = string | number | null | undefined
export type Accessors<T, K extends string> = Record<K, (item: T) => SortValue>

function compare(a: SortValue, b: SortValue): number {
  const aEmpty = a === null || a === undefined || a === ''
  const bEmpty = b === null || b === undefined || b === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1 // empties last
  if (bEmpty) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

/** Pure sort — empties always sort last regardless of direction. Used by DataTable (client mode). */
export function sortItems<T>(items: T[], accessor: (item: T) => SortValue, dir: SortDir): T[] {
  const factor = dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const av = accessor(a)
    const bv = accessor(b)
    const aEmpty = av === null || av === undefined || av === ''
    const bEmpty = bv === null || bv === undefined || bv === ''
    if (aEmpty || bEmpty) return compare(av, bv)
    return compare(av, bv) * factor
  })
}

/**
 * Generic table sorting. Pass the (filtered) rows and a map of column-key →
 * value accessor. Returns the sorted rows plus the current sort state and a
 * `toggle(key)` that cycles asc → desc → asc.
 */
export function useSort<T, K extends string>(
  items: T[],
  accessors: Accessors<T, K>,
  initial?: SortState<K>,
) {
  const [sort, setSort] = useState<SortState<K> | null>(initial ?? null)

  // Keep accessors in a ref so an inline `{ … }` map doesn't re-sort every render.
  const accRef = useRef(accessors)
  accRef.current = accessors

  const sorted = useMemo(() => {
    if (!sort) return items
    const acc = accRef.current[sort.key]
    return acc ? sortItems(items, acc, sort.dir) : items
  }, [items, sort])

  const toggle = (key: K) =>
    setSort((prev) => (prev && prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return { sorted, sort, toggle }
}
