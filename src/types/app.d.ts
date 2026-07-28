// ── Ambient app types ────────────────────────────────────────────────────────
// Ported from ERP-Client's types/app.d.ts, trimmed to what GarageFlow uses.

/**
 * The envelope every endpoint answers with, success or failure.
 *
 * `message` is written by the API and shown to the user verbatim — the
 * dashboard does not compose its own success or error wording.
 */
interface BackendSuccessResponse<T> {
  data: T
  /** 1 on success, 0 on failure. */
  status: number
  message: string
  /** Field name → validation messages. Null unless the request failed validation. */
  errors: Record<string, string[]> | null
}

type BackendErrorResponse<T = unknown> = BackendSuccessResponse<T>

/**
 * Payload of every list endpoint.
 *
 * `count` is the total across all pages, ignoring skip/take, so a pager can be
 * sized from one response. `list` is the requested page.
 */
interface PaginatedResponse<T> {
  count: number
  list: T[]
}

/**
 * Query parameters accepted by every list endpoint. Omit `take` to get every
 * matching row — that is what the dashboard, reports and global search do.
 */
interface IPaginationParams {
  skip?: number
  take?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  search?: string
}

type SetState<T> = React.Dispatch<React.SetStateAction<T>>
