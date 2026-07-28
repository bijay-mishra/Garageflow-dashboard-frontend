import type { ManagedAxiosError } from '@/lib/api-types'

/**
 * What `initApiRequest` throws when a request fails. React Query surfaces it to
 * `onError`, and `error.message` is already a sentence fit to show in a toast —
 * see `manageErrorResponse` in lib/api-schema.ts.
 *
 * Ported from ERP-Client's utils/http.exception.ts, with `message` passed up to
 * `Error` so plain `error.message` reads correctly without unwrapping `.error`.
 */
class HttpException<TError extends ManagedAxiosError = ManagedAxiosError> extends Error {
  public error: TError

  public status?: number

  constructor(error: TError, status?: number) {
    super(error.message)
    this.name = 'HttpException'
    this.error = error
    this.status = status ?? error.statusCode
  }
}

export default HttpException
