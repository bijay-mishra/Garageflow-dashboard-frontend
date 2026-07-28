import type { AxiosError, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios'
import { ApiEndPoints } from '@/constants/config/getEndpoints'
import { getAccessToken } from '@/lib/authStorage'
import { pathParamSanitizer } from '@/utils/sanitizer'
import {
  RequestBodyType,
  RequestMethod,
  type ApiDetailType,
  type GenericObj,
  type ManagedAxiosError,
  type Primitive,
  type RequestDataType,
  type TransformedRequestData,
} from './api-types'

// ── Request pipeline ─────────────────────────────────────────────────────────
// Ported from ERP-Client's lib/api-schema.ts. Encryption, basic auth and the
// cookie/AccessToken headers are dropped: GarageFlow's API has no auth layer
// yet, and inventing headers it ignores would be noise.

/** Three minutes — long enough for a slow report, short enough to fail visibly. */
const REQUEST_TIMEOUT_MS = 60 * 3 * 1000

export function getQueryString(data: GenericObj<Primitive>): URLSearchParams {
  const params = new URLSearchParams()
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    params.set(key, String(value))
  })
  return params
}

/**
 * Fills `{id}`-style placeholders in an endpoint's `controllerName`.
 * Returns a copy — the endpoint objects in `*-api.ts` are shared module state
 * and must not be mutated (ERP-Client's version uses Object.assign and does
 * mutate; that bug would make a second call reuse the first call's id).
 */
export const sanitizeApiController = (
  apiDetail: ApiDetailType,
  pathVariables?: GenericObj<Primitive>,
): ApiDetailType => ({
  ...apiDetail,
  controllerName:
    pathVariables && Object.keys(pathVariables).length
      ? pathParamSanitizer(apiDetail.controllerName, pathVariables, '{}')
      : apiDetail.controllerName,
})

export const getRequestHeaders = (apiDetails: ApiDetailType): RawAxiosRequestHeaders => {
  const headers: RawAxiosRequestHeaders = {
    'Content-Type': 'application/json',
    'Accept-Language': 'en',
  }

  // Read at request time, not at import time: the token changes on sign-in,
  // refresh and sign-out, and this module is evaluated once.
  const accessToken = getAccessToken()
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  switch (apiDetails.requestBodyType) {
    case RequestBodyType.QUERY_STRING:
      return { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }
    case RequestBodyType.FORM_DATA:
      // Let the browser set the multipart boundary itself.
      return { ...headers, 'Content-Type': 'multipart/form-data' }
    case RequestBodyType.NO_AUTH: {
      // Login, forgot-password and reset-password must not carry a stale token.
      const { Authorization: _omitted, ...rest } = headers
      return rest
    }
    default:
      return headers
  }
}

/**
 * Turns a plain object into FormData. Arrays become `field[0].key` entries,
 * which ASP.NET Core model binding accepts for `List<T>` parameters.
 *
 * Never build FormData by hand in a component — declare the endpoint with
 * `requestBodyType: RequestBodyType.FORM_DATA` and pass a plain object.
 */
export const getFormData = (requestData: RequestDataType): FormData => {
  const formData = new FormData()

  Object.keys(requestData).forEach((key) => {
    const value = requestData[key]

    // null/undefined would be appended as the strings "null"/"undefined".
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      value.forEach((element, index) => {
        if (element instanceof File || element instanceof Blob) {
          formData.append(`${key}[${index}]`, element)
        } else if (element instanceof Object) {
          Object.entries(element as GenericObj).forEach(([elementKey, elementValue]) => {
            if (elementValue === undefined || elementValue === null) return
            formData.append(`${key}[${index}].${elementKey}`, String(elementValue))
          })
        } else {
          formData.append(`${key}[${index}]`, String(element))
        }
      })
      return
    }

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value)
      return
    }

    formData.append(key, String(value))
  })

  return formData
}

/** Shapes the request body according to the endpoint's `requestBodyType`. */
export const transformRequestData = (
  apiDetails: ApiDetailType,
  requestData?: RequestDataType,
): TransformedRequestData | undefined => {
  if (!requestData) return undefined

  switch (apiDetails.requestBodyType) {
    case RequestBodyType.FORM_DATA:
      return getFormData(requestData)
    case RequestBodyType.QUERY_STRING:
      return getQueryString(requestData as GenericObj<Primitive>)
    default:
      return requestData
  }
}

/**
 * Flattens an axios failure into one readable sentence plus the structured
 * body.
 *
 * The API sends its own `message` on failures too, so that is what surfaces —
 * the dashboard never invents error wording when the server has supplied it.
 * Only the transport-level cases below have no server message to use.
 */
export const manageErrorResponse = (
  error: AxiosError<BackendErrorResponse>,
): ManagedAxiosError<BackendErrorResponse> => {
  const { message, config, request, response, isAxiosError, code } = error

  if (response) {
    const data = response.data

    return {
      message: data?.message || `Request failed with status ${response.status}.`,
      data,
      statusCode: response.status,
      noConnection: false,
      config,
      isAxiosError,
    }
  }

  // Request left the app but nothing came back — API down, CORS, or timeout.
  if (request) {
    const noConnection = ['ERR_NETWORK', 'ERR_CANCELED', 'ECONNABORTED'].includes(code ?? '')
    return {
      message: noConnection
        ? 'Could not reach the GarageFlow API. Is it running on ' + ApiEndPoints.baseUrl + '?'
        : 'Something went wrong.',
      statusCode: undefined,
      noConnection,
      config,
      isAxiosError,
    }
  }

  return { message, noConnection: false, config, isAxiosError }
}

/** Builds the axios config for one call. Resolves the API origin per request. */
export const getAxiosParams = (
  apiDetails: ApiDetailType,
  headers: RawAxiosRequestHeaders = {},
): AxiosRequestConfig => {
  const axiosRequestParams: AxiosRequestConfig = {
    // Read now, not at import time — config.json lands after modules evaluate.
    baseURL: apiDetails.baseUrl ?? ApiEndPoints.baseUrl,
    url: apiDetails.controllerName,
    method: apiDetails.requestMethod ?? RequestMethod.GET,
    responseType: 'json',
    timeout: REQUEST_TIMEOUT_MS,
    headers: { ...getRequestHeaders(apiDetails), ...headers },
  }

  if (apiDetails.requestBodyType === RequestBodyType.FILE) axiosRequestParams.responseType = 'blob'

  return axiosRequestParams
}
