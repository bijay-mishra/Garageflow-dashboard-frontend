import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'
import type { IDelivery, IDeliveryTrack, DeliveryStatus } from './delivery-schema'

export const deliveryApi = {
  getDeliveryList: {
    actionName: 'GET_DELIVERY_LIST',
    controllerName: '/deliveries',
    requestMethod: RequestMethod.GET,
  },

  getDeliveryTrack: {
    actionName: 'GET_DELIVERY_TRACK',
    controllerName: '/deliveries/{id}/track',
    requestMethod: RequestMethod.GET,
  },

  startDelivery: {
    actionName: 'START_DELIVERY',
    controllerName: '/deliveries/{id}/start',
    requestMethod: RequestMethod.POST,
  },

  completeDelivery: {
    actionName: 'COMPLETE_DELIVERY',
    controllerName: '/deliveries/{id}/complete',
    requestMethod: RequestMethod.POST,
  },

  chooseDelivery: {
    actionName: 'CHOOSE_DELIVERY',
    controllerName: '/deliveries/{id}/choose',
    requestMethod: RequestMethod.POST,
  },
} as const

export interface DeliveryListParams extends IPaginationParams {
  status?: DeliveryStatus
  /** Hides finished and cancelled handovers. The default the API applies. */
  active?: boolean
}

export const useGetDeliveryListPaged = (params: DeliveryListParams, enabled = true) =>
  useQuery({
    queryKey: [deliveryApi.getDeliveryList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IDelivery>>({
        apiDetails: deliveryApi.getDeliveryList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    // A van on the road moves whether or not anyone refetches, so this list goes
    // stale on its own in a way a customer list never does.
    staleTime: 15 * 1000,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

/**
 * One handover's live position and route.
 *
 * Polled rather than streamed. The driver's phone reports only when it has moved
 * 25 metres, so there is nothing to push between those points, and a poll
 * survives a dropped connection without any reconnect logic of its own.
 *
 * `refetchInterval` is a function so it can stop on its own: once a handover is
 * delivered or has not set off, nothing about it will change, and a timer that
 * keeps firing for the life of the page is a request every few seconds to learn
 * the same thing.
 */
export const useGetDeliveryTrack = (id: string | null, intervalMs = 10_000) =>
  useQuery({
    queryKey: [deliveryApi.getDeliveryTrack.actionName, id],
    queryFn: () =>
      initApiRequest<IDeliveryTrack>({
        apiDetails: deliveryApi.getDeliveryTrack,
        pathVariables: { id: id as string },
      }),
    enabled: !!id,
    refetchInterval: (query) => {
      const track = query.state.data?.data?.data
      return track?.delivery.status === 'OutForDelivery' ? intervalMs : false
    },
    // Pointless while the tab is in the background: nobody is watching the map,
    // and it resumes on focus.
    refetchIntervalInBackground: false,
    select: (res) => res?.data?.data ?? null,
  })

const useInvalidateDeliveries = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: [deliveryApi.getDeliveryList.actionName] })
    queryClient.invalidateQueries({ queryKey: [deliveryApi.getDeliveryTrack.actionName] })
  }
}

export const useStartDelivery = () => {
  const invalidate = useInvalidateDeliveries()
  const toast = useToast()

  return useMutation({
    mutationKey: [deliveryApi.startDelivery.actionName],
    mutationFn: ({ id, driver }: { id: string; driver: string }) =>
      initApiRequest<IDelivery>({
        apiDetails: deliveryApi.startDelivery,
        pathVariables: { id },
        requestData: { driver },
      }),
    onSuccess: (res) => {
      invalidate()
      // The server names the driver back — worth showing as sent.
      toast.success(res?.data?.message ?? 'Delivery started')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not start the delivery'),
  })
}

export const useCompleteDelivery = () => {
  const invalidate = useInvalidateDeliveries()
  const toast = useToast()

  return useMutation({
    mutationKey: [deliveryApi.completeDelivery.actionName],
    mutationFn: (id: string) =>
      initApiRequest<IDelivery>({
        apiDetails: deliveryApi.completeDelivery,
        pathVariables: { id },
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Handed over')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not close the handover'),
  })
}

/**
 * Records the customer's choice on their behalf.
 *
 * Staff need this because plenty of customers will say it over the phone rather
 * than tapping it in the app. The fee is fixed by the server at this moment and
 * lands on the bill as a line, exactly as it would have from the app.
 */
export const useChooseDelivery = () => {
  const invalidate = useInvalidateDeliveries()
  const toast = useToast()

  return useMutation({
    mutationKey: [deliveryApi.chooseDelivery.actionName],
    mutationFn: ({ id, method }: { id: string; method: string }) =>
      initApiRequest<IDelivery>({
        apiDetails: deliveryApi.chooseDelivery,
        pathVariables: { id },
        requestData: { method },
      }),
    onSuccess: (res) => {
      invalidate()
      // Carries the fee, and whether delivery came out free on this bill.
      toast.success(res?.data?.message ?? 'Handover updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save the choice'),
  })
}
