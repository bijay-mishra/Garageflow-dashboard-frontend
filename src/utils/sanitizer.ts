import type { GenericObj, Primitive } from '@/lib/api-types'

/**
 * Substitutes path placeholders in a URL.
 *
 * `pathParamSanitizer('/api/customers/{id}', { id: 'CUS-001' }, '{}')`
 * → `/api/customers/CUS-001`
 *
 * Ported from ERP-Client's utils/sanitizer.ts.
 */
export const pathParamSanitizer = (
  path: string,
  params: GenericObj<Primitive> | undefined,
  identifier: '{}' | ':' = ':',
): string =>
  Object.entries(params || {}).reduce(
    (acc, [key, value]) => acc.replace(identifier === '{}' ? `{${key}}` : `:${key}`, String(value)),
    path,
  )

/** Appends a query object to a path, preserving any query string already there. */
export const pathQuerySanitizer = (path: string, query?: GenericObj<Primitive>): string => {
  if (!query) return path
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, String(value))
  })

  const qs = searchParams.toString()
  if (!qs) return path
  return `${path}${path.includes('?') ? '&' : '?'}${qs}`
}
