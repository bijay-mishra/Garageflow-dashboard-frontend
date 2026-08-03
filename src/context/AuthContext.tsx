import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setSessionExpiredHandler } from '@/lib/api-request'
import {
  clearSession,
  forgetImpersonation,
  getAccessToken,
  getStoredUser,
  mustSetPassword as readMustSetPassword,
  saveSession,
  saveUser,
  setMustSetPassword as storeMustSetPassword,
  type StoredUser,
} from '@/lib/authStorage'

export type AuthUser = StoredUser

interface AuthCtx {
  user: AuthUser | null
  /**
   * True while this account is still on a password somebody else set. Nothing
   * but the "choose a password" screen renders until it clears.
   */
  mustSetPassword: boolean
  /** Called by the login form once the API has returned a session. */
  signIn: (session: {
    accessToken: string
    refreshToken: string
    user: AuthUser
    mustSetPassword?: boolean
  }) => void
  /** Called once the account has chosen its own password. */
  passwordWasSet: () => void
  /** Clears the local session. Revoking the refresh token is the caller's job. */
  signOut: () => void
  /** Replaces the cached user, e.g. after `/auth/me` or a profile edit. */
  setUser: (user: AuthUser) => void
  updateProfile: (patch: Partial<Pick<AuthUser, 'name' | 'email' | 'phone'>>) => void
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

/**
 * Holds the signed-in user.
 *
 * The tokens themselves live in lib/authStorage — the request layer needs them
 * synchronously, outside React. This context only mirrors the user object so
 * components can render a name and a role.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Seeded from storage so a refresh does not bounce you to the login screen
  // before the token has been checked.
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(() => (getAccessToken() ? getStoredUser() : null))
  const [pending, setPending] = useState(() => Boolean(getAccessToken()) && readMustSetPassword())

  const signIn: AuthCtx['signIn'] = useCallback(
    (session) => {
      // Nothing cached belongs to the incoming user. Done here rather than on
      // sign-out: clearing while the dashboard is still mounted would make every
      // mounted query refetch against a session that no longer exists.
      queryClient.clear()

      // Signing in fresh ends any impersonation, even one this tab was in the
      // middle of. Left behind, the parked operator session would be restored
      // later over whoever signs in now, and the banner would claim an ordinary
      // session was viewing somebody else's workshop.
      forgetImpersonation()

      saveSession(session)
      setUser(session.user)
      setPending(Boolean(session.mustSetPassword))
    },
    [queryClient],
  )

  const passwordWasSet = useCallback(() => {
    storeMustSetPassword(false)
    setPending(false)
  }, [])

  const replaceUser: AuthCtx['setUser'] = useCallback((next) => {
    saveUser(next)
    setUser(next)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    forgetImpersonation()
    setUser(null)
    setPending(false)
  }, [])

  const updateProfile: AuthCtx['updateProfile'] = useCallback((patch) => {
    setUser((previous) => {
      if (!previous) return previous
      const next = { ...previous, ...patch }
      saveUser(next)
      return next
    })
  }, [])

  // When the request layer gives up on refreshing, the session is over. This is
  // the bridge from that non-React code back into React state.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
      setPending(false)
    })
    return () => setSessionExpiredHandler(null)
  }, [])

  // A session restored from storage is only a claim until the API agrees — the
  // account may have been deactivated since. Layout re-reads /auth/me on mount
  // for that; a dead token 401s there and lands back in signOut above.

  const value = useMemo(
    () => ({
      user,
      mustSetPassword: pending,
      signIn,
      passwordWasSet,
      signOut,
      setUser: replaceUser,
      updateProfile,
    }),
    [user, pending, signIn, passwordWasSet, signOut, replaceUser, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
