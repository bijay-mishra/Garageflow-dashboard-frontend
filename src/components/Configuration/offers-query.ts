import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'

// ── Offers and loyalty ───────────────────────────────────────────────────────
// Three schemes a workshop can run, configured on one screen:
//
//   Stamp card — every Nth completed job earns one named service free.
//   Points     — every Rs X paid earns a point; points come off a later bill.
//   Offers     — a straight percentage off, for a window, for some services.
//
// Unlike the configuration hooks next door, there is no companyCode scope here.
// What a garage gives away is its own commercial decision and the API has no
// operator-on-behalf-of mode for it, so these always act on the caller's own
// company.

export const offersApi = {
  program: {
    actionName: 'GET_LOYALTY_PROGRAM',
    controllerName: '/offers/program',
    requestMethod: RequestMethod.GET,
  },
  saveProgram: {
    actionName: 'SAVE_LOYALTY_PROGRAM',
    controllerName: '/offers/program',
    requestMethod: RequestMethod.PUT,
  },
  offers: {
    actionName: 'GET_OFFERS',
    controllerName: '/offers',
    requestMethod: RequestMethod.GET,
  },
  createOffer: {
    actionName: 'CREATE_OFFER',
    controllerName: '/offers',
    requestMethod: RequestMethod.POST,
  },
  updateOffer: {
    actionName: 'UPDATE_OFFER',
    controllerName: '/offers/{id}',
    requestMethod: RequestMethod.PUT,
  },
  deleteOffer: {
    actionName: 'DELETE_OFFER',
    controllerName: '/offers/{id}',
    requestMethod: RequestMethod.DELETE,
  },
} as const

export interface ILoyaltyProgram {
  stampCardEnabled: boolean
  jobsPerReward: number
  rewardServiceId: string | null
  rewardServiceName: string | null
  rewardServicePrice: number
  pointsEnabled: boolean
  /** Rupees paid that earn one point. */
  rupeesPerPoint: number
  /** What one point takes off a bill, in rupees. */
  pointValue: number
  minimumPointsToRedeem: number
  /** Fraction of a bill points may cover — 0.5 is half. */
  maxPointsShareOfBill: number
  /**
   * On *and* able to pay out. Sent by the server rather than derived here: a
   * card switched on with no reward chosen is a real state, and both clients
   * have to draw it the same way.
   */
  stampCardRuns: boolean
  pointsRun: boolean
}

export type ISaveLoyaltyProgram = Omit<
  ILoyaltyProgram,
  'rewardServiceName' | 'rewardServicePrice' | 'stampCardRuns' | 'pointsRun'
>

export interface IOffer {
  id: string
  name: string
  description: string
  /** Whole percent — 15 means 15%. */
  percent: number
  /** Most it can take off one bill, or null for no cap. */
  maxDiscount: number | null
  startsOn: string | null
  /** Last day, inclusive. */
  endsOn: string | null
  /** Empty means every service. */
  serviceIds: string[]
  /** Empty means every category. */
  categories: string[]
  /** Empty means every vehicle type. */
  vehicleTypes: string[]
  isActive: boolean
  /**
   * Active *and* inside its window. Two separate reasons an offer might not be
   * applying, and the Active toggle alone hides the second one.
   */
  runsToday: boolean
}

export type ISaveOffer = Omit<IOffer, 'id' | 'runsToday'>

export const useGetLoyaltyProgram = (enabled = true) =>
  useQuery({
    queryKey: [offersApi.program.actionName],
    queryFn: () => initApiRequest<ILoyaltyProgram>({ apiDetails: offersApi.program }),
    enabled,
    select: (res) => res?.data?.data,
  })

export const useGetOffers = (enabled = true) =>
  useQuery({
    queryKey: [offersApi.offers.actionName],
    queryFn: () => initApiRequest<IOffer[]>({ apiDetails: offersApi.offers }),
    enabled,
    select: (res) => res?.data?.data ?? [],
  })

/** Shared plumbing: run it, tell the user, refetch the list it changed. */
function useOfferMutation<TVariables>(
  apiDetails: (typeof offersApi)[keyof typeof offersApi],
  listAction: string,
  build: (vars: TVariables) => {
    pathVariables?: Record<string, string | number>
    requestData?: unknown
  },
  fallback: string,
) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [apiDetails.actionName],
    mutationFn: (vars: TVariables) => initApiRequest({ apiDetails, ...build(vars) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [listAction] })
      toast.success(res?.data?.message ?? fallback)
    },
    onError: (error: Error) => toast.error(error.message || fallback),
  })
}

export const useSaveLoyaltyProgram = () =>
  useOfferMutation<ISaveLoyaltyProgram>(
    offersApi.saveProgram,
    offersApi.program.actionName,
    (requestData) => ({ requestData }),
    'Could not save the loyalty scheme',
  )

export const useCreateOffer = () =>
  useOfferMutation<ISaveOffer>(
    offersApi.createOffer,
    offersApi.offers.actionName,
    (requestData) => ({ requestData }),
    'Could not create the offer',
  )

export const useUpdateOffer = () =>
  useOfferMutation<{ id: string } & ISaveOffer>(
    offersApi.updateOffer,
    offersApi.offers.actionName,
    ({ id, ...requestData }) => ({ pathVariables: { id }, requestData }),
    'Could not save the offer',
  )

export const useDeleteOffer = () =>
  useOfferMutation<{ id: string }>(
    offersApi.deleteOffer,
    offersApi.offers.actionName,
    ({ id }) => ({ pathVariables: { id } }),
    'Could not delete the offer',
  )
