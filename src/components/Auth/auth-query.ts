import { useMutation, useQuery } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { useToast } from '@/context/ToastContext'
import { authApi } from './auth-api'
import type {
  ChangePasswordFormType,
  ForgotPasswordFormType,
  IAuthResult,
  IAuthUser,
  IPasswordResetStarted,
  LoginFormType,
  ProfileFormType,
  SetPasswordFormType,
} from './auth-schema'

// ── Auth queries ─────────────────────────────────────────────────────────────
// These deliberately do not toast on success or error: the login and reset
// screens show the server's message inline, next to the field it concerns,
// which reads better than a corner toast for a form you are staring at.

export const useLogin = () =>
  useMutation({
    mutationKey: [authApi.login.actionName],
    mutationFn: (requestData: LoginFormType) =>
      initApiRequest<IAuthResult>({ apiDetails: authApi.login, requestData }),
    // The caller stores the session and navigates; see AuthContext.login.
  })

/**
 * Replaces the password an account was handed, on first sign-in.
 *
 * Returns a fresh session, which the caller stores — the old tokens are revoked
 * server-side, so keeping them would leave the tab holding a dead refresh token
 * and an access token that still says "must set password".
 */
export const useSetPassword = () =>
  useMutation({
    mutationKey: [authApi.setPassword.actionName],
    mutationFn: (requestData: { newPassword: SetPasswordFormType['newPassword'] }) =>
      initApiRequest<IAuthResult>({ apiDetails: authApi.setPassword, requestData }),
  })

/**
 * Revokes the refresh token server-side.
 *
 * Takes the token as an argument rather than reading storage, because the
 * caller clears the local session *first* — see the sign-out handler in
 * Topbar.tsx for why the order matters.
 *
 * Deliberately does NOT touch the query cache. Clearing it here would empty
 * every cache entry while the dashboard is still mounted, and each mounted
 * query would immediately refetch — with the session already gone, producing a
 * burst of doomed requests. The cache is cleared on the next sign-in instead,
 * by which point nothing is rendering the old user's data.
 */
export const useLogout = () =>
  useMutation({
    mutationKey: [authApi.logout.actionName],
    mutationFn: (refreshToken: string) =>
      initApiRequest<null>({ apiDetails: authApi.logout, requestData: { refreshToken } }),
  })

/**
 * Re-reads the signed-in user from the token.
 *
 * Runs on mount when a session is restored from storage, so a deactivated or
 * deleted account is caught rather than trusted from localStorage forever.
 */
export const useGetCurrentUser = (enabled = true) =>
  useQuery({
    queryKey: [authApi.me.actionName],
    queryFn: () => initApiRequest<IAuthUser>({ apiDetails: authApi.me }),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    select: (res) => res?.data?.data ?? null,
  })

/**
 * Asks for a six-digit code by email.
 *
 * Succeeds whether or not the account exists — the API refuses to say, so that
 * this form cannot be used to find out which addresses have accounts. There is
 * nothing to branch on and the screen moves to the code step either way.
 */
export const useForgotPassword = () =>
  useMutation({
    mutationKey: [authApi.forgotPassword.actionName],
    mutationFn: (requestData: ForgotPasswordFormType) =>
      initApiRequest<IPasswordResetStarted>({ apiDetails: authApi.forgotPassword, requestData }),
  })

/**
 * Checks the code before asking for a new password.
 *
 * Spends nothing, so a good code still works at the next step. Its whole point
 * is that a mistyped digit is caught here rather than after somebody has chosen
 * and confirmed a password they then have to type again.
 */
export const useVerifyResetCode = () =>
  useMutation({
    mutationKey: [authApi.verifyResetCode.actionName],
    mutationFn: (requestData: { companyCode: string; email: string; code: string }) =>
      initApiRequest<null>({ apiDetails: authApi.verifyResetCode, requestData }),
  })

export const useResetPassword = () =>
  useMutation({
    mutationKey: [authApi.resetPassword.actionName],
    mutationFn: (requestData: {
      companyCode: string
      email: string
      code: string
      newPassword: string
    }) => initApiRequest<null>({ apiDetails: authApi.resetPassword, requestData }),
  })

/** Saves the signed-in user's own name, email and phone. */
export const useUpdateProfile = () => {
  const toast = useToast()

  return useMutation({
    mutationKey: [authApi.updateProfile.actionName],
    mutationFn: (requestData: ProfileFormType) =>
      initApiRequest<IAuthUser>({ apiDetails: authApi.updateProfile, requestData }),
    onSuccess: (res) => toast.success(res?.data?.message ?? 'Profile updated'),
    onError: (error: Error) => toast.error(error.message || 'Could not update profile'),
  })
}

/** Changing your own password. Signs out every session, including this one. */
export const useChangePassword = () => {
  const toast = useToast()

  return useMutation({
    mutationKey: [authApi.changePassword.actionName],
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordFormType) =>
      initApiRequest<null>({
        apiDetails: authApi.changePassword,
        requestData: { currentPassword, newPassword },
      }),
    onSuccess: (res) => toast.success(res?.data?.message ?? 'Password changed'),
    onError: (error: Error) => toast.error(error.message || 'Could not change password'),
  })
}
