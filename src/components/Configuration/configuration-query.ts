import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'

// ── Configuration ────────────────────────────────────────────────────────────
// The lists a workshop keeps about itself: accounting years and locations.
//
// One set of hooks for two screens. A workshop's owner opens /configuration and
// works on their own company; an operator opens the console's Configuration and
// passes a company code to work on somebody's behalf. The endpoints are the
// same either way, which is the point — a separate "admin" copy of these calls
// is how the two versions drift until one permits what the other refuses.

export const configApi = {
  fiscalYears: {
    actionName: 'GET_FISCAL_YEARS',
    controllerName: '/configuration/fiscal-years',
    requestMethod: RequestMethod.GET,
  },
  createFiscalYear: {
    actionName: 'CREATE_FISCAL_YEAR',
    controllerName: '/configuration/fiscal-years',
    requestMethod: RequestMethod.POST,
  },
  updateFiscalYear: {
    actionName: 'UPDATE_FISCAL_YEAR',
    controllerName: '/configuration/fiscal-years/{id}',
    requestMethod: RequestMethod.PUT,
  },
  deleteFiscalYear: {
    actionName: 'DELETE_FISCAL_YEAR',
    controllerName: '/configuration/fiscal-years/{id}',
    requestMethod: RequestMethod.DELETE,
  },
  branches: {
    actionName: 'GET_CONFIG_BRANCHES',
    controllerName: '/configuration/branches',
    requestMethod: RequestMethod.GET,
  },
  createBranch: {
    actionName: 'CREATE_BRANCH',
    controllerName: '/configuration/branches',
    requestMethod: RequestMethod.POST,
  },
  updateBranch: {
    actionName: 'UPDATE_BRANCH',
    controllerName: '/configuration/branches/{id}',
    requestMethod: RequestMethod.PUT,
  },
  deleteBranch: {
    actionName: 'DELETE_BRANCH',
    controllerName: '/configuration/branches/{id}',
    requestMethod: RequestMethod.DELETE,
  },
} as const

export interface IFiscalYearRecord {
  id: number
  /** How it is written and spoken: "2082/83". */
  code: string
  start: string
  end: string
  /** Closed years can be read but nothing new lands in them. */
  isClosed: boolean
  isCurrent: boolean
  /** What a delete would orphan. */
  invoiceCount: number
  jobCount: number
}

export interface IBranchDetail {
  id: string
  name: string
  address: string
  phone: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export interface ISaveFiscalYear {
  code: string
  start: string
  end: string
  isClosed: boolean
}

export interface ISaveBranch {
  name: string
  address: string
  phone: string
  isDefault: boolean
  isActive: boolean
}

/**
 * The company these hooks act on.
 *
 * Undefined means "whichever company my token says", which is what a workshop's
 * own staff always want. The console passes a code; the server ignores it for
 * anyone but an operator, so this cannot be used to reach across companies.
 */
type Scope = { companyCode?: string }

const params = (scope: Scope) => (scope.companyCode ? { companyCode: scope.companyCode } : undefined)

// The company is part of the cache key. Without it, an operator opening a second
// company would be shown the first one's list until the refetch landed.
const key = (action: string, scope: Scope) => [action, scope.companyCode ?? 'self']

export const useGetFiscalYears = (scope: Scope = {}, enabled = true) =>
  useQuery({
    queryKey: key(configApi.fiscalYears.actionName, scope),
    queryFn: () =>
      initApiRequest<IFiscalYearRecord[]>({
        apiDetails: configApi.fiscalYears,
        params: params(scope),
      }),
    enabled,
    select: (res) => res?.data?.data ?? [],
  })

export const useGetConfigBranches = (scope: Scope = {}, enabled = true) =>
  useQuery({
    queryKey: key(configApi.branches.actionName, scope),
    queryFn: () =>
      initApiRequest<IBranchDetail[]>({
        apiDetails: configApi.branches,
        params: params(scope),
      }),
    enabled,
    select: (res) => res?.data?.data ?? [],
  })

/** Shared plumbing: run it, tell the user, refetch the list it changed. */
function useConfigMutation<TVariables>(
  apiDetails: (typeof configApi)[keyof typeof configApi],
  listAction: string,
  scope: Scope,
  build: (vars: TVariables) => { pathVariables?: Record<string, string | number>; requestData?: unknown },
  fallback: string,
) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [apiDetails.actionName, scope.companyCode ?? 'self'],
    mutationFn: (vars: TVariables) =>
      initApiRequest({ apiDetails, params: params(scope), ...build(vars) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: key(listAction, scope) })
      toast.success(res?.data?.message ?? fallback)
    },
    onError: (error: Error) => toast.error(error.message || fallback),
  })
}

export const useCreateFiscalYear = (scope: Scope = {}) =>
  useConfigMutation<ISaveFiscalYear>(
    configApi.createFiscalYear,
    configApi.fiscalYears.actionName,
    scope,
    (requestData) => ({ requestData }),
    'Could not add the fiscal year',
  )

export const useUpdateFiscalYear = (scope: Scope = {}) =>
  useConfigMutation<{ id: number } & ISaveFiscalYear>(
    configApi.updateFiscalYear,
    configApi.fiscalYears.actionName,
    scope,
    ({ id, ...requestData }) => ({ pathVariables: { id }, requestData }),
    'Could not update the fiscal year',
  )

export const useDeleteFiscalYear = (scope: Scope = {}) =>
  useConfigMutation<{ id: number }>(
    configApi.deleteFiscalYear,
    configApi.fiscalYears.actionName,
    scope,
    ({ id }) => ({ pathVariables: { id } }),
    'Could not remove the fiscal year',
  )

export const useCreateBranch = (scope: Scope = {}) =>
  useConfigMutation<ISaveBranch>(
    configApi.createBranch,
    configApi.branches.actionName,
    scope,
    (requestData) => ({ requestData }),
    'Could not add the branch',
  )

export const useUpdateBranch = (scope: Scope = {}) =>
  useConfigMutation<{ id: string } & ISaveBranch>(
    configApi.updateBranch,
    configApi.branches.actionName,
    scope,
    ({ id, ...requestData }) => ({ pathVariables: { id }, requestData }),
    'Could not update the branch',
  )

export const useDeleteBranch = (scope: Scope = {}) =>
  useConfigMutation<{ id: string }>(
    configApi.deleteBranch,
    configApi.branches.actionName,
    scope,
    ({ id }) => ({ pathVariables: { id } }),
    'Could not remove the branch',
  )
