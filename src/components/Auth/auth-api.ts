import { RequestBodyType, RequestMethod } from '@/lib/api-types'

// ── Auth endpoints ───────────────────────────────────────────────────────────
// The pre-sign-in endpoints are marked NO_AUTH so lib/api-schema.ts leaves the
// Authorization header off, and lib/api-request.ts treats a 401 from them as
// "wrong credentials" rather than "expired session" — no refresh attempt, and
// the server's message reaches the user.

export const authApi = {
  login: {
    actionName: 'AUTH_LOGIN',
    controllerName: '/auth/login',
    requestMethod: RequestMethod.POST,
    requestBodyType: RequestBodyType.NO_AUTH,
  },

  /** Handled directly inside lib/api-request.ts; listed here for completeness. */
  refresh: {
    actionName: 'AUTH_REFRESH',
    controllerName: '/auth/refresh',
    requestMethod: RequestMethod.POST,
    requestBodyType: RequestBodyType.NO_AUTH,
  },

  logout: {
    actionName: 'AUTH_LOGOUT',
    controllerName: '/auth/logout',
    requestMethod: RequestMethod.POST,
    requestBodyType: RequestBodyType.NO_AUTH,
  },

  me: {
    actionName: 'AUTH_ME',
    controllerName: '/auth/me',
    requestMethod: RequestMethod.GET,
  },

  forgotPassword: {
    actionName: 'AUTH_FORGOT_PASSWORD',
    controllerName: '/auth/forgot-password',
    requestMethod: RequestMethod.POST,
    requestBodyType: RequestBodyType.NO_AUTH,
  },

  resetPassword: {
    actionName: 'AUTH_RESET_PASSWORD',
    controllerName: '/auth/reset-password',
    requestMethod: RequestMethod.POST,
    requestBodyType: RequestBodyType.NO_AUTH,
  },

  updateProfile: {
    actionName: 'AUTH_UPDATE_PROFILE',
    controllerName: '/auth/profile',
    requestMethod: RequestMethod.PUT,
  },

  changePassword: {
    actionName: 'AUTH_CHANGE_PASSWORD',
    controllerName: '/auth/change-password',
    requestMethod: RequestMethod.PUT,
  },
} as const
