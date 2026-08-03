import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'

// ── Menus ────────────────────────────────────────────────────────────────────
// What the sidebar draws, and who at this company sees what.
//
// This replaces the hardcoded array that used to live in src/lib/navigation.ts.
// Every workshop got the same menu from it, and the only way to change one was
// to ship a new bundle — so "the front desk shouldn't see the takings" was a
// feature request rather than a setting.

export const menuApi = {
  mine: {
    actionName: 'GET_MY_MENU',
    controllerName: '/menus',
    requestMethod: RequestMethod.GET,
  },
  access: {
    actionName: 'GET_MENU_ACCESS',
    controllerName: '/menus/access',
    requestMethod: RequestMethod.GET,
  },
  saveAccess: {
    actionName: 'SAVE_MENU_ACCESS',
    controllerName: '/menus/access',
    requestMethod: RequestMethod.PUT,
  },
  createRole: {
    actionName: 'CREATE_ROLE',
    controllerName: '/menus/roles',
    requestMethod: RequestMethod.POST,
  },
  updateRole: {
    actionName: 'UPDATE_ROLE',
    controllerName: '/menus/roles',
    requestMethod: RequestMethod.PUT,
  },
  deleteRole: {
    actionName: 'DELETE_ROLE',
    controllerName: '/menus/roles',
    requestMethod: RequestMethod.DELETE,
  },
} as const

/** The product roles a company role can be based on. */
export const BASE_ROLES = ['Owner', 'Manager', 'Advisor', 'Mechanic'] as const


export interface IMenuItem {
  key: string
  label: string
  /** Never empty — the server falls back to the English label. */
  labelNe: string
  /** Empty on a group that only holds children. */
  route: string
  icon: string
  parentKey: string | null
  sortOrder: number
  module: string | null
  /** True for rows a company cannot hide — home, and your own account. */
  isLocked: boolean
  isActive: boolean
}

export interface ICompanyRole {
  id: number
  /** What this workshop calls it. The identity menu choices are keyed by. */
  name: string
  /** Which product role the server authorises it as. */
  baseRole: string
  description: string
  /** True for the four the product ships — cannot be renamed or deleted. */
  isBuiltIn: boolean
  staffCount: number
  menuCount: number
}

export interface IMenuMatrix {
  items: IMenuItem[]
  roles: ICompanyRole[]
  /** role name → menu key → visible. Fully populated; defaults resolved server-side. */
  access: Record<string, Record<string, boolean>>
}

export interface ISaveRole {
  name: string
  baseRole: string
  description: string
}

/**
 * The signed-in user's own menu.
 *
 * Long `staleTime`: it changes when an operator grants a module or an owner
 * edits role access, neither of which happens while you are looking at the
 * screen. Refetching every minute to catch a change that happens twice a year
 * is not a trade worth making — and the sidebar is mounted on every page, so
 * the cost would be paid everywhere.
 */
export const useGetMenu = (enabled = true) =>
  useQuery({
    queryKey: [menuApi.mine.actionName],
    queryFn: () => initApiRequest<IMenuItem[]>({ apiDetails: menuApi.mine }),
    enabled,
    staleTime: 10 * 60 * 1000,
    select: (res) => res?.data?.data ?? [],
  })

/** Every role and every menu row, for the Role setup screen. Owner and manager only. */
export const useGetMenuAccess = (enabled = true) =>
  useQuery({
    queryKey: [menuApi.access.actionName],
    queryFn: () => initApiRequest<IMenuMatrix>({ apiDetails: menuApi.access }),
    enabled,
    select: (res) => res?.data?.data ?? null,
  })

/**
 * Adding, renaming and removing roles.
 *
 * Each returns the whole screen rather than the one row it touched: a role's
 * headcount and menu count both move when roles change, and letting the client
 * patch its own copy is how a screen ends up disagreeing with the server about
 * what it just did.
 */
const useRoleMutation = <TArgs>(
  key: string,
  request: (args: TArgs) => Parameters<typeof initApiRequest>[0],
  fallback: string,
) => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [key],
    mutationFn: (args: TArgs) => initApiRequest<IMenuMatrix>(request(args)),
    onSuccess: (res) => {
      queryClient.setQueryData([menuApi.access.actionName], res)
      queryClient.invalidateQueries({ queryKey: [menuApi.access.actionName] })

      // The sidebar too — a role you are yourself in can change under you.
      queryClient.invalidateQueries({ queryKey: [menuApi.mine.actionName] })

      toast.success(res?.data?.message ?? 'Saved')
    },
    onError: (error: Error) => toast.error(error.message || fallback),
  })
}

export const useCreateRole = () =>
  useRoleMutation<ISaveRole>(
    menuApi.createRole.actionName,
    (requestData) => ({ apiDetails: menuApi.createRole, requestData }),
    'Could not add the role',
  )

export const useUpdateRole = () =>
  useRoleMutation<{ id: number } & ISaveRole>(
    menuApi.updateRole.actionName,
    ({ id, ...requestData }) => ({
      apiDetails: { ...menuApi.updateRole, controllerName: `/menus/roles/${id}` },
      requestData,
    }),
    'Could not save the role',
  )

export const useDeleteRole = () =>
  useRoleMutation<{ id: number }>(
    menuApi.deleteRole.actionName,
    ({ id }) => ({
      apiDetails: { ...menuApi.deleteRole, controllerName: `/menus/roles/${id}` },
    }),
    'Could not remove the role',
  )

export const useSaveMenuAccess = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [menuApi.saveAccess.actionName],
    mutationFn: (requestData: { role: string; access: Record<string, boolean> }) =>
      initApiRequest({ apiDetails: menuApi.saveAccess, requestData }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [menuApi.access.actionName] })

      // Your own sidebar too: an owner editing the Owner row is changing the
      // menu they are looking at, and leaving it stale would make the save look
      // like it had not worked.
      queryClient.invalidateQueries({ queryKey: [menuApi.mine.actionName] })

      toast.success(res?.data?.message ?? 'Menu saved')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the menu'),
  })
}
