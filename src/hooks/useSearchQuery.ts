import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

/**
 * Search-box state seeded from the `?q=` URL param, so the topbar's global
 * search can deep-link straight into a filtered list. Re-seeds on every
 * navigation (location key changes) and is a plain `useState` pair otherwise —
 * typing in the box never touches the URL.
 */
export function useSearchQuery(): [string, (v: string) => void] {
  const [params] = useSearchParams()
  const location = useLocation()
  const [query, setQuery] = useState(() => params.get('q') ?? '')

  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') ?? '')
    // Keyed on the navigation itself, not the param, so repeat searches for the
    // same term still re-apply.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  return [query, setQuery]
}
