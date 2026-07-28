import { useEffect, useMemo, useState } from 'react'
import type { TableState } from '@/components/common/table/DataTable'
import { DEFAULT_PAGE_SIZES } from '@/components/common/table/DataTable'

/** Query parameters a list endpoint accepts: paging, sorting, plus any filters. */
export type TableQuery = IPaginationParams & Record<string, string | number | boolean | undefined>

/**
 * Holds the page / pageSize / sort of a **server-mode** DataTable and converts
 * it to the `skip`/`take` the API expects.
 *
 * Pass the page's filter values as `resetOn`: whenever one changes the table
 * returns to page 1. Without that, narrowing a search while on page 4 would ask
 * the server for rows past the end of the new result set and the table would
 * look empty.
 *
 * ```tsx
 * const table = useTableState({ pageSize: 20 }, [debouncedSearch, fuel])
 * const query = table.toQuery({ search: debouncedSearch, fuel })
 * const { data, isFetching } = useGetVehicleListPaged(query)
 *
 * <DataTable
 *   serverMode
 *   loading={isFetching}
 *   data={data?.list ?? []}
 *   total={data?.count ?? 0}     // full total, so the pager sizes itself
 *   state={table.state}
 *   onStateChange={table.setState}
 *   columns={columns}
 *   rowKey={(v) => v.id}
 * />
 * ```
 */
export function useTableState(initial?: Partial<TableState>, resetOn: unknown[] = []) {
  const [state, setState] = useState<TableState>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZES[0],
    sort: null,
    ...initial,
  })

  useEffect(() => {
    setState((s) => (s.page === 1 ? s : { ...s, page: 1 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetOn)

  const toQuery = useMemo(
    () =>
      (extra?: Record<string, string | number | boolean | undefined>): TableQuery => ({
        skip: (state.page - 1) * state.pageSize,
        take: state.pageSize,
        sortBy: state.sort?.key,
        sortDir: state.sort?.dir,
        ...extra,
      }),
    [state],
  )

  return { state, setState, toQuery }
}
