import Axios, { type AxiosError, type AxiosResponse, type RawAxiosRequestHeaders } from 'axios'
import HttpException from '@/utils/http.exception'
import { clearSession, getRefreshToken, saveTokens } from '@/lib/authStorage'
import { getAxiosParams, manageErrorResponse, sanitizeApiController, transformRequestData } from './api-schema'
import { RequestBodyType, type ApiDetailType, type GenericObj, type Primitive } from './api-types'

// ── The one place a request is made ──────────────────────────────────────────
// Ported from ERP-Client's lib/api-request.ts. Every call in the app goes
// through here, driven by an endpoint declared in a feature's `*-api.ts`.
// Never call axios or fetch directly from a component.

export interface InitApiRequest {
  /** The endpoint entry from a `*-api.ts` file. */
  apiDetails: ApiDetailType
  /** Values for `{placeholder}` segments in the endpoint's controllerName. */
  pathVariables?: GenericObj<Primitive>
  /** Query string parameters. */
  params?: GenericObj<Primitive>
  /** Request body. Shaped by `requestBodyType` — pass a plain object. */
  requestData?: unknown
  signal?: AbortSignal
  headers?: RawAxiosRequestHeaders
}

/**
 * Where the session goes when it can no longer be recovered. Set by
 * AuthContext so this module can end a session without importing React.
 */
let onSessionExpired: (() => void) | null = null

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler
}

/**
 * Refresh in flight, if any.
 *
 * A page fires several queries at once, so an expired access token produces a
 * burst of 401s. They all await this one promise — otherwise each would spend
 * the refresh token, and rotation would invalidate the others.
 */
let refreshInFlight: Promise<boolean> | null = null

/** Endpoint used to refresh. Declared here to avoid a cycle with auth-api.ts. */
const REFRESH_ENDPOINT = '/auth/refresh'

/**
 * Trades the stored refresh token for a new pair. Returns false when the
 * session is genuinely over, which is the caller's cue to stop retrying.
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    // Deliberately a bare axios call: routing it through initApiRequest would
    // recurse straight back into this handler on failure.
    const res = await Axios.request<BackendSuccessResponse<{ accessToken: string; refreshToken: string }>>({
      baseURL: getAxiosParams({ controllerName: REFRESH_ENDPOINT }).baseURL,
      url: REFRESH_ENDPOINT,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { refreshToken },
    })

    const tokens = res?.data?.data
    if (!tokens?.accessToken) return false

    saveTokens(tokens.accessToken, tokens.refreshToken)
    return true
  } catch {
    return false
  }
}

/**
 * Issues one request and returns the raw axios response.
 *
 * Every endpoint answers with the `{ data, status, message }` envelope, so
 * callers read the payload at `res?.data?.data` and the user-facing sentence at
 * `res?.data?.message` — see any `*-query.ts` hook.
 *
 * On a 401 the access token is refreshed once and the request replayed. If the
 * refresh also fails the session is cleared and the app returns to the login
 * screen.
 *
 * Throws {@link HttpException} on failure, carrying the server's own `message`.
 */
export const initApiRequest = async <TData>({
  apiDetails,
  pathVariables,
  params,
  headers,
  signal,
  requestData,
}: InitApiRequest): Promise<AxiosResponse<BackendSuccessResponse<TData>>> => {
  const sanitizedDetails = sanitizeApiController(apiDetails, pathVariables)

  const send = () =>
    Axios.request<BackendSuccessResponse<TData>>({
      ...getAxiosParams(sanitizedDetails, headers),
      params,
      signal,
      data: transformRequestData(sanitizedDetails, requestData as GenericObj | undefined),
    })

  try {
    return await send()
  } catch (error) {
    const axiosError = error as AxiosError<BackendErrorResponse>

    // A 401 from a NO_AUTH endpoint means bad credentials, not a dead session —
    // refreshing would be nonsense, and the message should reach the user.
    const isAuthEndpoint = sanitizedDetails.requestBodyType === RequestBodyType.NO_AUTH

    if (axiosError.response?.status === 401 && !isAuthEndpoint) {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null
      })

      if (await refreshInFlight) {
        try {
          return await send()
        } catch (retryError) {
          throw new HttpException(manageErrorResponse(retryError as AxiosError<BackendErrorResponse>))
        }
      }

      clearSession()
      onSessionExpired?.()
    }

    throw new HttpException(manageErrorResponse(axiosError))
  }
}

export default initApiRequest
