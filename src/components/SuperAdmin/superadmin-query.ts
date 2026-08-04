import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestBodyType, RequestMethod } from '@/lib/api-types'
import {
  beginImpersonation,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveSession,
  type StoredUser,
} from '@/lib/authStorage'
import { useToast } from '@/context/ToastContext'

// ── Superadmin console ───────────────────────────────────────────────────────
// Every company on the platform. The only part of the dashboard that reads
// across tenants — everything else is scoped to whichever company the token
// carries.

export const superAdminApi = {
  companies: {
    actionName: 'SA_COMPANIES',
    controllerName: '/superadmin/companies',
    requestMethod: RequestMethod.GET,
  },
  modules: {
    actionName: 'SA_MODULES',
    controllerName: '/superadmin/modules',
    requestMethod: RequestMethod.GET,
  },
  createCompany: {
    actionName: 'SA_CREATE_COMPANY',
    controllerName: '/superadmin/companies',
    requestMethod: RequestMethod.POST,
  },
  updateCompany: {
    actionName: 'SA_UPDATE_COMPANY',
    controllerName: '/superadmin/companies/{code}',
    requestMethod: RequestMethod.PUT,
  },
  menus: {
    actionName: 'SA_MENUS',
    controllerName: '/superadmin/menus',
    requestMethod: RequestMethod.GET,
  },
  updateMenu: {
    actionName: 'SA_UPDATE_MENU',
    controllerName: '/superadmin/menus/{key}',
    requestMethod: RequestMethod.PUT,
  },
  uploadCompanyLogo: {
    actionName: 'SA_UPLOAD_COMPANY_LOGO',
    controllerName: '/superadmin/companies/{code}/logo',
    requestMethod: RequestMethod.POST,
    requestBodyType: RequestBodyType.FORM_DATA,
  },
  deleteCompanyLogo: {
    actionName: 'SA_DELETE_COMPANY_LOGO',
    controllerName: '/superadmin/companies/{code}/logo',
    requestMethod: RequestMethod.DELETE,
  },
  deleteCompany: {
    actionName: 'SA_DELETE_COMPANY',
    controllerName: '/superadmin/companies/{code}',
    requestMethod: RequestMethod.DELETE,
  },
  impersonate: {
    actionName: 'SA_IMPERSONATE',
    controllerName: '/superadmin/companies/{code}/impersonate',
    requestMethod: RequestMethod.POST,
  },
  impersonations: {
    actionName: 'SA_IMPERSONATIONS',
    controllerName: '/superadmin/impersonations',
    requestMethod: RequestMethod.GET,
  },
} as const

export interface ICompany {
  companyCode: string
  name: string
  legalName: string
  phone: string
  email: string
  address: string
  /** Absolute URL of their logo, or null if they have not got one. */
  logoUrl: string | null
  /** False means nobody there can sign in. Their data is untouched. */
  isActive: boolean
  isListed: boolean
  enabledModules: string[]
  userCount: number
  customerCount: number
  jobCount: number
  createdAt: string
  lastActiveAt: string | null
}

export interface ICreateCompany {
  companyCode: string
  name: string
  legalName?: string
  address?: string
  phone?: string
  email?: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
  /**
   * Leave blank for a generated one-time password, which is the better choice —
   * a password one person invents for another tends to be the same password
   * every time, and that is a master key across every company they set up.
   */
  ownerPassword?: string
  enabledModules?: string[]
}

/** What creating a company returns: the company, and the password to hand over. */
export interface ICompanyCreated {
  company: ICompany
  /**
   * Shown once and never retrievable — only its hash is stored. An operator who
   * could look it up later is an operator who could sign in as the owner later,
   * which is the thing this whole flow exists to prevent.
   */
  oneTimePassword: string
}

export interface ISuperAdminMenu {
  key: string
  label: string
  labelNe: string
  route: string
  icon: string
  parentKey: string | null
  sortOrder: number
  /** The module gating this row, or null if it is always available. */
  module: string | null
  /** True for rows no company can hide — home, and a person's own account. */
  isLocked: boolean
  isActive: boolean
}

export interface IImpersonation {
  userEmail: string
  companyCode: string
  at: string
  reason: string
}

export const useGetCompanies = (enabled = true) =>
  useQuery({
    queryKey: [superAdminApi.companies.actionName],
    queryFn: () => initApiRequest<ICompany[]>({ apiDetails: superAdminApi.companies }),
    enabled,
    select: (res) => res?.data?.data ?? [],
  })

/** The module names the server recognises. Never hardcoded here — an unknown
 *  name would render a toggle that gates nothing. */
export const useGetModules = (enabled = true) =>
  useQuery({
    queryKey: [superAdminApi.modules.actionName],
    queryFn: () => initApiRequest<string[]>({ apiDetails: superAdminApi.modules }),
    enabled,
    staleTime: 60 * 60 * 1000,
    select: (res) => res?.data?.data ?? [],
  })

/**
 * The menu catalogue, retired rows included.
 *
 * The console sees inactive rows and the dashboard does not — retiring one is
 * the operator's decision, so the screen that makes it has to show what has
 * already been retired.
 */
export const useGetMenuCatalogue = (enabled = true) =>
  useQuery({
    queryKey: [superAdminApi.menus.actionName],
    queryFn: () => initApiRequest<ISuperAdminMenu[]>({ apiDetails: superAdminApi.menus }),
    enabled,
    select: (res) => res?.data?.data ?? [],
  })

export const useUpdateMenu = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [superAdminApi.updateMenu.actionName],
    mutationFn: ({ key, ...requestData }: { key: string } & Partial<ISuperAdminMenu>) =>
      initApiRequest<ISuperAdminMenu>({
        apiDetails: superAdminApi.updateMenu,
        pathVariables: { key },
        requestData,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [superAdminApi.menus.actionName] })
      toast.success(res?.data?.message ?? 'Menu updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update the menu'),
  })
}

export const useGetImpersonations = (enabled = true) =>
  useQuery({
    queryKey: [superAdminApi.impersonations.actionName],
    queryFn: () => initApiRequest<IImpersonation[]>({ apiDetails: superAdminApi.impersonations }),
    enabled,
    select: (res) => res?.data?.data ?? [],
  })

const useInvalidateCompanies = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [superAdminApi.companies.actionName] })
}

export const useCreateCompany = () => {
  const invalidate = useInvalidateCompanies()
  const toast = useToast()

  return useMutation({
    mutationKey: [superAdminApi.createCompany.actionName],
    mutationFn: (requestData: ICreateCompany) =>
      initApiRequest<ICompanyCreated>({ apiDetails: superAdminApi.createCompany, requestData }),
    onSuccess: (res) => {
      invalidate()
      // The server's sentence names the code the owner has to type at sign-in,
      // which is the one thing you must not paraphrase away.
      toast.success(res?.data?.message ?? 'Company created')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not create the company'),
  })
}

export const useUpdateCompany = () => {
  const invalidate = useInvalidateCompanies()
  const toast = useToast()

  return useMutation({
    mutationKey: [superAdminApi.updateCompany.actionName],
    mutationFn: ({
      code,
      ...requestData
    }: {
      code: string
      enabledModules?: string[]
      isActive?: boolean
      // Omitted fields are left alone by the server, so a form can send only
      // what it owns without having to resend the rest.
      name?: string
      legalName?: string
      address?: string
      phone?: string
      email?: string
    }) =>
      initApiRequest<ICompany>({
        apiDetails: superAdminApi.updateCompany,
        pathVariables: { code },
        requestData,
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Company updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update the company'),
  })
}

/**
 * Sets a company's logo on its behalf.
 *
 * The operator sets a company up before anyone at that workshop has ever signed
 * in, and the logo usually arrives in the same email as the name and the PAN.
 * Without this the first invoices go out bare, waiting on an owner who does not
 * yet know the setting exists.
 */
export const useUploadCompanyLogo = () => {
  const invalidate = useInvalidateCompanies()
  const toast = useToast()

  return useMutation({
    mutationKey: [superAdminApi.uploadCompanyLogo.actionName],
    mutationFn: ({ code, file }: { code: string; file: File }) =>
      initApiRequest<ICompany>({
        apiDetails: superAdminApi.uploadCompanyLogo,
        pathVariables: { code },
        requestData: { file },
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Logo set')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not upload the logo'),
  })
}

export const useDeleteCompanyLogo = () => {
  const invalidate = useInvalidateCompanies()
  const toast = useToast()

  return useMutation({
    mutationKey: [superAdminApi.deleteCompanyLogo.actionName],
    mutationFn: ({ code }: { code: string }) =>
      initApiRequest<ICompany>({
        apiDetails: superAdminApi.deleteCompanyLogo,
        pathVariables: { code },
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Logo removed')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not remove the logo'),
  })
}

/**
 * Erases a company and everything in it.
 *
 * No optimistic update and no cache surgery — the whole list is refetched. This
 * removes rows from a dozen tables server-side, and guessing at the result to
 * save one request is how a screen ends up disagreeing with the database about
 * something irreversible.
 */
export const useDeleteCompany = () => {
  const invalidate = useInvalidateCompanies()
  const toast = useToast()

  return useMutation({
    mutationKey: [superAdminApi.deleteCompany.actionName],
    mutationFn: ({ code, confirmCompanyCode }: { code: string; confirmCompanyCode: string }) =>
      initApiRequest({
        apiDetails: superAdminApi.deleteCompany,
        pathVariables: { code },
        requestData: { confirmCompanyCode },
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Company deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete the company'),
  })
}

interface ImpersonateResult {
  accessToken: string
  refreshToken: string
  user: StoredUser
}

/**
 * Swaps the superadmin session for one scoped to a company.
 *
 * The token that comes back carries that company and the Owner role, so the
 * ordinary dashboard works unchanged and the server's tenant filter applies
 * exactly as it does for the workshop's own staff — there is no second,
 * privileged path through the app that could behave differently from the real
 * one.
 *
 * The cache is cleared for the same reason it is on a workspace switch: nothing
 * held belongs to the company being entered.
 */
export const useImpersonate = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [superAdminApi.impersonate.actionName],
    mutationFn: ({ code, reason }: { code: string; reason?: string }) =>
      initApiRequest<ImpersonateResult>({
        apiDetails: superAdminApi.impersonate,
        pathVariables: { code },
        requestData: { reason },
      }),
    onSuccess: (res) => {
      const session = res?.data?.data
      if (!session?.accessToken) return

      // The operator's own session is parked before the company's overwrites
      // it. Without this there is no way back: the token they are about to hold
      // is refused by every /superadmin endpoint, so the console would load and
      // then fill with 403s.
      const operator = getStoredUser()

      // The flag is set either way. If the operator's session could not be read
      // back there is nothing to restore, but the banner must still appear —
      // "you are inside somebody else's workshop" is the part that matters, and
      // Exit can fall back to asking them to sign in again.
      beginImpersonation(
        session.user.companyCode,
        operator
          ? {
              accessToken: getAccessToken() ?? '',
              refreshToken: getRefreshToken() ?? '',
              user: operator,
            }
          : null,
      )

      saveSession(session)
      queryClient.clear()

      toast.success(res?.data?.message ?? 'Signed in as company')

      // A full reload rather than a route change: every context in the tree —
      // auth, plan, workspace — was built for the superadmin session, and
      // reloading is the honest way to rebuild them all for the new one.
      window.location.href = '/'
    },
    onError: (error: Error) => toast.error(error.message || 'Could not open that company'),
  })
}
