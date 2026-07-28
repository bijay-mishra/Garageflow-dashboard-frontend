import { useMutation, useQuery } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { useToast } from '@/context/ToastContext'
import { authApi } from './auth-api'
import type {
  ChangePasswordFormType,
  ForgotPasswordFormType,
  IAuthResult,
  IAuthUser,
  LoginFormType,
  ProfileFormType,
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

export const useForgotPassword = () =>
  useMutation({
    mutationKey: [authApi.forgotPassword.actionName],
    mutationFn: (requestData: ForgotPasswordFormType) =>
      initApiRequest<null>({ apiDetails: authApi.forgotPassword, requestData }),
  })

export const useResetPassword = () =>
  useMutation({
    mutationKey: [authApi.resetPassword.actionName],
    mutationFn: (requestData: { token: string; newPassword: string }) =>
      initApiRequest<null>({ apiDetails: authApi.resetPassword, requestData }),
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
