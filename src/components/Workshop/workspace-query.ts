import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { saveTokens } from '@/lib/authStorage'
import { useToast } from '@/context/ToastContext'

// ── Workspace ────────────────────────────────────────────────────────────────
// Which branch and accounting year the dashboard is looking at.
//
// These used to be two strings in localStorage, chosen from a hardcoded list in
// src/data/seed.ts. Changing one updated a label and nothing else: no request
// left the browser, the token was untouched, and every table went on showing the
// same rows under a new heading. The control looked like it worked, which is
// worse than not having it.
//
// Now the selection is a server-side session fact carried in the JWT, and
// changing it mints a new token — see useSelectWorkspace below.

export const workspaceApi = {
  getWorkspace: {
    actionName: 'GET_WORKSPACE',
    controllerName: '/workspace',
    requestMethod: RequestMethod.GET,
  },

  selectWorkspace: {
    actionName: 'SELECT_WORKSPACE',
    controllerName: '/auth/select-workspace',
    requestMethod: RequestMethod.POST,
  },

  getModules: {
    actionName: 'GET_MY_MODULES',
    controllerName: '/workspace/modules',
    requestMethod: RequestMethod.GET,
  },
} as const

export interface IBranch {
  id: string
  name: string
  address: string
  phone: string
  isDefault: boolean
}

export interface IFiscalYear {
  code: string
  /** Gregorian window, so the UI can show what "2082/83" means. */
  start: string
  end: string
  isCurrent: boolean
}

export interface IWorkspace {
  branches: IBranch[]
  fiscalYears: IFiscalYear[]
  branchId: string | null
  branchName: string | null
  fiscalYear: string
  fiscalYearStart: string
  fiscalYearEnd: string
  /** False when viewing a closed year — the screens say so rather than looking broken. */
  isCurrentYear: boolean
}

/**
 * The current workspace and everything selectable.
 *
 * Long `staleTime`: branches and the list of years change roughly never, and the
 * *selection* is not refreshed by polling — it changes only through the mutation
 * below, which sets the new value directly.
 */
export const useGetWorkspace = (enabled = true) =>
  useQuery({
    queryKey: [workspaceApi.getWorkspace.actionName],
    queryFn: () => initApiRequest<IWorkspace>({ apiDetails: workspaceApi.getWorkspace }),
    enabled,
    staleTime: 10 * 60 * 1000,
    select: (res) => res?.data?.data ?? null,
  })

/**
 * Which parts of the product this company has been given.
 *
 * Same long `staleTime` as the workspace, and for the same reason: only an
 * operator can change it, and when they do the workshop's session is not the
 * one that finds out — they will see it on their next sign-in. Polling every
 * dashboard every minute to catch a change that happens twice a year is not a
 * trade worth making.
 */
export const useGetMyModules = (enabled = true) =>
  useQuery({
    queryKey: [workspaceApi.getModules.actionName],
    queryFn: () => initApiRequest<string[]>({ apiDetails: workspaceApi.getModules }),
    enabled,
    staleTime: 10 * 60 * 1000,
    select: (res) => res?.data?.data ?? [],
  })

interface SelectWorkspacePayload {
  branchId?: string
  fiscalYear?: string
}

interface AuthResult {
  accessToken: string
  refreshToken: string
}

/**
 * Switches branch or accounting year.
 *
 * Three things have to happen and all three used to be missing:
 *
 * 1. **The API is called.** The server records the choice against the account,
 *    so it survives a sign-out and is the same on any machine you sign in from.
 * 2. **The token is replaced.** The new JWT carries the selection, and every
 *    subsequent request is answered against it. This is what makes the switch
 *    real rather than cosmetic — the client cannot ask for one year and be
 *    handed another, and it cannot forge a year it has not been granted.
 * 3. **Everything refetches.** `clear()` rather than `invalidateQueries`,
 *    because nothing cached belongs to the new workspace: a job list, a bill, a
 *    dashboard total were all computed under the previous year. Invalidating
 *    would leave the old rows on screen, greyed, until each refetch landed —
 *    showing last year's numbers under this year's heading for as long as the
 *    slowest request takes.
 *
 * The tokens are saved *before* the cache is cleared, so the refetches that
 * clearing triggers already carry the new one. The other order would send a wave
 * of requests under the old token and get the old workspace straight back.
 */
export const useSelectWorkspace = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [workspaceApi.selectWorkspace.actionName],
    mutationFn: (requestData: SelectWorkspacePayload) =>
      initApiRequest<AuthResult>({ apiDetails: workspaceApi.selectWorkspace, requestData }),
    onSuccess: (res) => {
      const session = res?.data?.data

      if (session?.accessToken) {
        saveTokens(session.accessToken, session.refreshToken)
      }

      queryClient.clear()
      toast.success(res?.data?.message ?? 'Workspace updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not switch workspace'),
  })
}
