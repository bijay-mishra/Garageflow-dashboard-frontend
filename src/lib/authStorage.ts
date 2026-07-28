// ── Token storage ────────────────────────────────────────────────────────────
// One module owns where the session lives, so nothing else has to know. It is
// read synchronously by lib/api-schema.ts when building the Authorization
// header, which is why this is plain functions rather than React state.
//
// localStorage is readable by any script on the origin, so an XSS bug leaks the
// token. The stronger option is an httpOnly cookie the browser attaches
// automatically — that needs `withCredentials`, a same-site policy and CSRF
// protection on the API. Worth doing before this handles real customer data.

const ACCESS_TOKEN_KEY = 'gf_access_token'
const REFRESH_TOKEN_KEY = 'gf_refresh_token'
const USER_KEY = 'gf_auth'

/** The signed-in user as the API returns it from `/auth/login`. */
export interface StoredUser {
  id: string
  email: string
  name: string
  role: 'Owner' | 'Manager' | 'Advisor'
  workshop: string
  companyCode: string
  phone?: string
}

export interface StoredSession {
  accessToken: string
  refreshToken: string
  user: StoredUser
}

const canUseStorage = () => typeof window !== 'undefined'

export const getAccessToken = (): string | null =>
  canUseStorage() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null

export const getRefreshToken = (): string | null =>
  canUseStorage() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null

export function getStoredUser(): StoredUser | null {
  if (!canUseStorage()) return null

  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredUser>
    // A half-written or hand-edited entry is worse than none.
    if (typeof parsed?.email !== 'string') {
      localStorage.removeItem(USER_KEY)
      return null
    }

    return parsed as StoredUser
  } catch {
    return null
  }
}

export function saveSession(session: StoredSession): void {
  if (!canUseStorage()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

/** Replaces just the tokens — used after a refresh, which does not change the user. */
export function saveTokens(accessToken: string, refreshToken: string): void {
  if (!canUseStorage()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function saveUser(user: StoredUser): void {
  if (!canUseStorage()) return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  if (!canUseStorage()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
