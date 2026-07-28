import { useEffect, useState } from 'react'

/**
 * Trails `value` by `delay` ms.
 *
 * Search boxes feed server-side lists, and firing a request per keystroke would
 * both hammer the API and let an early response overwrite a later one. Debounce
 * the term, then key the query on the debounced value.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
