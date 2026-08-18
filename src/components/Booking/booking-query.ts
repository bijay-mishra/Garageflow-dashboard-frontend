import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'
import type { IBooking, BookingStatus } from './booking-schema'

export const bookingApi = {
  getBookingList: {
    actionName: 'GET_BOOKING_LIST',
    controllerName: '/bookings',
    requestMethod: RequestMethod.GET,
  },

  respondToBooking: {
    actionName: 'RESPOND_TO_BOOKING',
    controllerName: '/bookings/{id}/respond',
    requestMethod: RequestMethod.PUT,
  },

  convertBooking: {
    actionName: 'CONVERT_BOOKING',
    controllerName: '/bookings/{id}/convert',
    requestMethod: RequestMethod.POST,
  },

  cancelBooking: {
    actionName: 'CANCEL_BOOKING',
    controllerName: '/bookings/{id}/cancel',
    requestMethod: RequestMethod.PUT,
  },
} as const

export interface BookingListParams extends IPaginationParams {
  status?: BookingStatus
}

/**
 * The company's bookings, newest first.
 *
 * Scoping is the server's: staff get the whole company and a customer gets only
 * their own, whatever this asks for. There is no company parameter to get wrong.
 *
 * `staleTime` is short because this list is fed from outside the building — a
 * customer can add to it while an advisor is looking at the screen, and the
 * whole point of the page is that nobody has to be told to refresh.
 */
export const useGetBookingListPaged = (params: BookingListParams, enabled = true) =>
  useQuery({
    queryKey: [bookingApi.getBookingList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IBooking>>({
        apiDetails: bookingApi.getBookingList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 15 * 1000,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

/**
 * Invalidates bookings *and* job cards.
 *
 * Converting writes a job card, and leaving that list stale means an advisor
 * who converts a booking and switches to Job Cards does not find the job they
 * just created — which reads as the conversion having failed.
 */
const useInvalidateBookings = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: [bookingApi.getBookingList.actionName] })
    queryClient.invalidateQueries({ queryKey: ['GET_JOB_CARD_LIST'] })
  }
}

/** Confirms or declines. The customer is notified either way, by the server. */
export const useRespondToBooking = () => {
  const invalidate = useInvalidateBookings()
  const toast = useToast()

  return useMutation({
    mutationKey: [bookingApi.respondToBooking.actionName],
    mutationFn: ({
      id,
      status,
      staffNote,
    }: {
      id: string
      status: 'Confirmed' | 'Rejected'
      staffNote?: string
    }) =>
      initApiRequest<IBooking>({
        apiDetails: bookingApi.respondToBooking,
        pathVariables: { id },
        requestData: { status, staffNote },
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Booking updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not answer that booking'),
  })
}

/**
 * Turns a confirmed booking into a job card.
 *
 * The mechanic is optional — a workshop that assigns work at the bench rather
 * than at the counter should not be forced to pick one here.
 */
export const useConvertBooking = () => {
  const invalidate = useInvalidateBookings()
  const toast = useToast()

  return useMutation({
    mutationKey: [bookingApi.convertBooking.actionName],
    mutationFn: ({ id, mechanic }: { id: string; mechanic?: string }) =>
      initApiRequest({
        apiDetails: bookingApi.convertBooking,
        pathVariables: { id },
        params: mechanic ? { mechanic } : undefined,
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Job card created')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not create the job card'),
  })
}

export const useCancelBooking = () => {
  const invalidate = useInvalidateBookings()
  const toast = useToast()

  return useMutation({
    mutationKey: [bookingApi.cancelBooking.actionName],
    mutationFn: (id: string) =>
      initApiRequest<IBooking>({
        apiDetails: bookingApi.cancelBooking,
        pathVariables: { id },
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Booking cancelled')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not cancel that booking'),
  })
}
