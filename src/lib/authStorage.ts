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

/**
 * Set while the signed-in account is still on a password somebody else chose.
 *
 * Stored rather than kept in memory so a refresh mid-flow lands back on the
 * same screen instead of on a dashboard whose every request 403s. It is a
 * routing hint and nothing more — the token itself only reaches the one
 * endpoint, so clearing this by hand buys a screen full of refusals.
 */
const MUST_SET_PASSWORD_KEY = 'gf_must_set_password'

/** The signed-in user as the API returns it from `/auth/login`. */
export interface StoredUser {
  id: string
  email: string
  name: string
  /** SuperAdmin belongs to no company and only reaches /superadmin. */
  role: 'SuperAdmin' | 'Owner' | 'Manager' | 'Advisor'
  workshop: string
  companyCode: string
  phone?: string
}

export interface StoredSession {
  accessToken: string
  refreshToken: string
  user: StoredUser
  /** True when the API says this password was handed over rather than chosen. */
  mustSetPassword?: boolean
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
  setMustSetPassword(Boolean(session.mustSetPassword))
}

export const mustSetPassword = (): boolean =>
  canUseStorage() && localStorage.getItem(MUST_SET_PASSWORD_KEY) === '1'

export function setMustSetPassword(required: boolean): void {
  if (!canUseStorage()) return

  if (required) localStorage.setItem(MUST_SET_PASSWORD_KEY, '1')
  else localStorage.removeItem(MUST_SET_PASSWORD_KEY)
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
  localStorage.removeItem(MUST_SET_PASSWORD_KEY)
}

// ── Impersonation ────────────────────────────────────────────────────────────
// Signing in as a company replaces the operator's session with the company's,
// because the whole point is that the dashboard behaves exactly as it does for
// the workshop's own staff. That leaves the operator with no way back: their own
// session is gone, and the token they now hold is refused by every /superadmin
// endpoint. The console shell would load and then fill with 403s.
//
// So the operator's session is parked here first and restored on the way out.
// sessionStorage rather than localStorage: it belongs to this tab and this
// sitting, and an operator session left behind in a shared browser after the tab
// closed would be a worse bug than the one this fixes.

const IMPERSONATING_KEY = 'gf_impersonating'
const OPERATOR_SESSION_KEY = 'gf_operator_session'

/** The company being viewed, or null when this is an ordinary session. */
export const getImpersonatedCompany = (): string | null =>
  canUseStorage() ? sessionStorage.getItem(IMPERSONATING_KEY) : null

/**
 * Drops the impersonation state without restoring anything.
 *
 * For sign-in and sign-out, where the session being parked is about to be
 * irrelevant. Distinct from {@link endImpersonation}, which puts the operator
 * back — calling that one here would resurrect them over whoever just signed in.
 */
export function forgetImpersonation(): void {
  if (!canUseStorage()) return
  sessionStorage.removeItem(IMPERSONATING_KEY)
  sessionStorage.removeItem(OPERATOR_SESSION_KEY)
}

/**
 * Parks the operator's own session before the company's replaces it.
 *
 * A null session still marks the tab as impersonating. Being unable to restore
 * them is a reason to make them sign in again on the way out, not a reason to
 * hide the banner and let them work on a stranger's data unwarned.
 */
export function beginImpersonation(companyCode: string, operator: StoredSession | null): void {
  if (!canUseStorage()) return
  sessionStorage.setItem(IMPERSONATING_KEY, companyCode)

  if (operator) sessionStorage.setItem(OPERATOR_SESSION_KEY, JSON.stringify(operator))
  else sessionStorage.removeItem(OPERATOR_SESSION_KEY)
}

/**
 * Puts the operator's session back, and reports whether there was one.
 *
 * False means the parked session is gone — a reopened tab, or storage cleared.
 * The caller then has to send them to sign in again rather than pretend.
 */
export function endImpersonation(): boolean {
  if (!canUseStorage()) return false

  const raw = sessionStorage.getItem(OPERATOR_SESSION_KEY)

  sessionStorage.removeItem(IMPERSONATING_KEY)
  sessionStorage.removeItem(OPERATOR_SESSION_KEY)

  if (!raw) {
    clearSession()
    return false
  }

  try {
    saveSession(JSON.parse(raw) as StoredSession)
    return true
  } catch {
    clearSession()
    return false
  }
}
