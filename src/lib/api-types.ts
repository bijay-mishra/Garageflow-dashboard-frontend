import type { AxiosRequestConfig } from 'axios'

// ── API request types ────────────────────────────────────────────────────────
// Ported from ERP-Client's lib/api-types.ts. Encryption and basic-auth request
// body types are dropped — GarageFlow's .NET API needs neither.

export type Primitive = string | number | boolean | null | undefined

export interface GenericObj<Value = unknown> {
  [key: string]: Value
}

export type RequestDataType = GenericObj<unknown>

export type TransformedRequestData = FormData | RequestDataType | URLSearchParams

export enum RequestMethod {
  GET = 'GET',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
}

export enum RequestBodyType {
  /** `application/x-www-form-urlencoded` */
  QUERY_STRING = 'QUERY_STRING',
  /** `multipart/form-data`; api-schema builds the FormData for you. */
  FORM_DATA = 'FORM_DATA',
  /** Skips the Authorization header — login, password reset, and the like. */
  NO_AUTH = 'NO_AUTH',
  /** Response comes back as a Blob rather than JSON. */
  FILE = 'FILE',
}

/**
 * One endpoint, as declared in a feature's `*-api.ts` file.
 *
 * `actionName` doubles as the React Query key, so it has to be unique across
 * the app — that is why they read like `GET_CUSTOMER_LIST`.
 */
export interface ApiDetailType {
  actionName?: string | string[]
  /** Full URL, optionally with `{id}`-style path placeholders. */
  controllerName: string
  requestMethod?: RequestMethod
  requestBodyType?: RequestBodyType
  baseUrl?: string
}

export interface ApiRequestDetail {
  requestData?: RequestDataType
  pathVariables?: GenericObj<Primitive>
  params?: GenericObj<Primitive>
}

/** Normalised failure shape thrown as an <see cref="HttpException"/>. */
export interface ManagedAxiosError<TData = unknown> {
  message: string
  data?: TData
  statusCode?: number
  /** True when the request never reached the server (API down, CORS, timeout). */
  noConnection: boolean
  config?: AxiosRequestConfig
  isAxiosError?: boolean
}

// Failure bodies use the same { data, status, message } envelope as successes —
// see BackendSuccessResponse in src/types/app.d.ts.
