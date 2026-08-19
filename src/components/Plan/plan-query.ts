import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'

export const planApi = {
  getWorkshopPlans: {
    actionName: 'GET_WORKSHOP_PLANS',
    controllerName: '/plans/workshop',
    requestMethod: RequestMethod.GET,
  },

  subscribeWorkshop: {
    actionName: 'SUBSCRIBE_WORKSHOP',
    controllerName: '/plans/workshop/subscribe',
    requestMethod: RequestMethod.POST,
  },

  verifyWorkshopPlan: {
    actionName: 'VERIFY_WORKSHOP_PLAN',
    controllerName: '/plans/workshop/verify',
    requestMethod: RequestMethod.POST,
  },
} as const

export interface IWorkshopPlan {
  code: string
  name: string
  monthlyPrice: number
  /** Twelve months with the discount already applied — not monthly × 12. */
  yearlyPrice: number
  modules: string[]
}

export interface IWorkshopPlans {
  /** The tier this company already covers. Empty when none match. */
  currentCode: string
  expiresAt: string | null
  yearlyMonths: number
  /** Wallets that can take the money. Empty means buying is unavailable. */
  providers: string[]
  items: IWorkshopPlan[]
}

export interface IPlanCheckout {
  reference: string
  provider: string
  amount: number
  /** Where to send the browser to pay. */
  url: string
}

export interface IWorkshopSubscription {
  planCode: string
  status: string
  amount: number
  months: number
  expiresAt: string | null
  settled: boolean
}

/**
 * The tiers, the current one, and how it can be paid for.
 *
 * The prices come from the server rather than the page. They used to be a
 * `const PLANS` array in Plans.tsx, which is also where "upgrade" wrote a plan
 * id straight to localStorage — so anyone with DevTools could award themselves
 * multi-branch. Nothing chargeable is decided in the browser now.
 */
export const useGetWorkshopPlans = (enabled = true) =>
  useQuery({
    queryKey: [planApi.getWorkshopPlans.actionName],
    queryFn: () =>
      initApiRequest<IWorkshopPlans>({ apiDetails: planApi.getWorkshopPlans }),
    enabled,
    select: (res) => res?.data?.data ?? null,
  })

/** Starts a wallet payment and hands back where to send the browser. */
export const useSubscribeWorkshop = () => {
  const toast = useToast()

  return useMutation({
    mutationKey: [planApi.subscribeWorkshop.actionName],
    mutationFn: ({
      code,
      months,
      provider,
    }: {
      code: string
      months: 1 | 12
      provider: string
    }) =>
      initApiRequest<IPlanCheckout>({
        apiDetails: planApi.subscribeWorkshop,
        requestData: { code, months, provider },
      }),
    onError: (error: Error) => toast.error(error.message || 'Could not start that payment'),
  })
}

/**
 * Asks the server whether a payment went through.
 *
 * Called when the tab regains focus, because the buyer has been away on the
 * wallet's own site and there is no reliable way for that site to hand control
 * back into a single-page app. Safe to call repeatedly — the server settles a
 * reference once.
 *
 * Invalidates the module list on success: paying is the one action that changes
 * which menu entries exist, and leaving that cached shows somebody a sidebar
 * that does not include what they just bought.
 */
export const useVerifyWorkshopPlan = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [planApi.verifyWorkshopPlan.actionName],
    mutationFn: ({ reference, callbackData }: { reference: string; callbackData?: string }) =>
      initApiRequest<IWorkshopSubscription>({
        apiDetails: planApi.verifyWorkshopPlan,
        requestData: { reference, callbackData },
      }),
    onSuccess: (res) => {
      const result = res?.data?.data

      if (!result?.settled) return

      queryClient.invalidateQueries({ queryKey: [planApi.getWorkshopPlans.actionName] })
      // The two that decide what the app shows: the granted module list, and
      // the sidebar built from it. Named literally rather than imported to
      // avoid a cycle — plans are bought from a page those modules gate.
      queryClient.invalidateQueries({ queryKey: ['GET_MY_MODULES'] })
      queryClient.invalidateQueries({ queryKey: ['GET_MY_MENU'] })

      toast.success(res?.data?.message ?? 'Your plan is active')
    },
  })
}
