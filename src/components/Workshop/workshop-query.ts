import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'

// ── Workshop ─────────────────────────────────────────────────────────────────
// The shop's own details. These used to be constants in src/data/seed.ts,
// compiled into the bundle — fine for one workshop, impossible for two.

export const workshopApi = {
  getWorkshop: {
    actionName: 'GET_WORKSHOP',
    controllerName: '/workshop',
    requestMethod: RequestMethod.GET,
  },

  updateWorkshop: {
    actionName: 'UPDATE_WORKSHOP',
    controllerName: '/workshop',
    requestMethod: RequestMethod.PUT,
  },
} as const

/** The workshop as `GET /api/workshop` returns it. */
export interface IWorkshop {
  name: string
  /** Registered name — what a tax invoice has to carry. */
  legalName: string
  address: string
  phone: string
  email: string
  /** PAN, printed on every bill. */
  taxNumber: string
  latitude: number | null
  longitude: number | null
  openingHours: string
  invoiceFooter: string

  // ── Directory listing ──────────────────────────────────────────────────────
  // Whether this workshop appears to customers browsing the app for a garage.
  // Off by default: a shop that bought this to run its own books has not agreed
  // to be advertised, and publishing its name and address without asking would
  // be a decision made on its behalf.

  /** A sentence or two shown on the garage's card in the app. */
  about: string
  isListed: boolean

  // ── Home delivery ──────────────────────────────────────────────────────────

  // ── Bank transfer ──────────────────────────────────────────────────────
  // Shown to a customer paying by transfer. Not a gateway: the app displays
  // these, the customer moves the money, and staff confirm it.
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  bankBranch: string
  /** True once there is enough on file to actually pay into. */
  canBankTransfer: boolean

  /**
   * True when delivery can actually be quoted — the switch is on *and* the
   * workshop has a pin. Computed by the server, because a distance-based fee
   * with nothing to measure from is not a price.
   */
  canDeliver: boolean
  deliveryEnabled: boolean
  deliveryBaseFee: number
  deliveryPerKm: number
  /** Bills at or above this get delivery free. Zero switches that off. */
  deliveryFreeAbove: number
  /** Beyond this many km the app stops offering delivery at all. */
  deliveryMaxKm: number

  /**
   * Gateways with working credentials on the server right now. Computed, not
   * stored — a workshop with no Khalti key never sees a Khalti button.
   */
  onlineProviders: string[]
}

/** `canDeliver` is derived, so it is read-only and never sent back. */
export type WorkshopFormType = Omit<
  IWorkshop,
  'onlineProviders' | 'canDeliver' | 'canBankTransfer'
> & {
  clearLocation?: boolean
}

/**
 * The workshop record.
 *
 * Long `staleTime`: a shop's name and PAN change roughly never, and this is read
 * by the printed bill, the settings screen and anything that shows the address.
 */
export const useGetWorkshop = (enabled = true) =>
  useQuery({
    queryKey: [workshopApi.getWorkshop.actionName],
    queryFn: () => initApiRequest<IWorkshop>({ apiDetails: workshopApi.getWorkshop }),
    enabled,
    staleTime: 10 * 60 * 1000,
    select: (res) => res?.data?.data ?? null,
  })

export const useUpdateWorkshop = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [workshopApi.updateWorkshop.actionName],
    mutationFn: (requestData: Partial<WorkshopFormType>) =>
      initApiRequest<IWorkshop>({ apiDetails: workshopApi.updateWorkshop, requestData }),
    onSuccess: (res) => {
      // Refetched rather than dropped: the printed bill reads this, and a stale
      // PAN on a tax document is worse than a redundant request.
      queryClient.invalidateQueries({ queryKey: [workshopApi.getWorkshop.actionName] })
      toast.success(res?.data?.message ?? 'Workshop details saved')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save workshop details'),
  })
}
