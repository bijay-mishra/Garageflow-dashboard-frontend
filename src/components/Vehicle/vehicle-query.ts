import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { invalidateInBackground } from '@/lib/queryClient'
import { useToast } from '@/context/ToastContext'
import { customerApi } from '@/components/Customer/customer-api'
import { jobCardApi } from '@/components/JobCard/jobcard-api'
import { dashboardApi } from '@/components/Dashboard/dashboard-api'
import { vehicleApi } from './vehicle-api'
import type { IVehicle, VehicleFormType } from './vehicle-schema'

// The vehicle list is the screen these mutations run from, so it refetches.
// A vehicle change also moves its owner's `vehicleCount` and the job lists —
// those are dropped without a request and reload on navigation. See
// `invalidateInBackground` in lib/queryClient.ts.

/** Extra filters the vehicle list accepts on top of paging. */
export interface VehicleListParams extends IPaginationParams {
  /** Petrol, Diesel, Electric, Hybrid or CNG. Omit for all. */
  fuel?: string
  /** Bike, Car, Van, Bus, Truck or Tractor. Omit for all. */
  type?: string
}

export const useGetVehicleList = (enabled = true) =>
  useQuery({
    queryKey: [vehicleApi.getVehicleList.actionName],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IVehicle>>({ apiDetails: vehicleApi.getVehicleList }),
    enabled,
    select: (res) => res?.data?.data?.list ?? [],
  })

export const useGetVehicleListPaged = (params: VehicleListParams, enabled = true) =>
  useQuery({
    queryKey: [vehicleApi.getVehicleList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IVehicle>>({
        apiDetails: vehicleApi.getVehicleList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

/** Every row matching the filter, ignoring paging — for CSV export. */
export const useFetchAllVehicles = () => {
  const queryClient = useQueryClient()

  return (params: VehicleListParams = {}) =>
    queryClient
      .fetchQuery({
        queryKey: [vehicleApi.getVehicleList.actionName, 'export', params],
        queryFn: () =>
          initApiRequest<PaginatedResponse<IVehicle>>({
            apiDetails: vehicleApi.getVehicleList,
            params: { ...params, skip: undefined, take: undefined },
          }),
        staleTime: 0,
      })
      .then((res) => res?.data?.data?.list ?? [])
}

export const useGetVehicleById = (id: string | null) =>
  useQuery({
    queryKey: [vehicleApi.getVehicleById.actionName, id],
    queryFn: () =>
      initApiRequest<IVehicle>({
        apiDetails: vehicleApi.getVehicleById,
        pathVariables: { id: id as string },
      }),
    enabled: !!id,
    select: (res) => res?.data?.data ?? null,
  })

export const useAddVehicle = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [vehicleApi.addVehicle.actionName],
    mutationFn: (requestData: VehicleFormType) =>
      initApiRequest<IVehicle>({ apiDetails: vehicleApi.addVehicle, requestData }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [vehicleApi.getVehicleList.actionName] })
      // A new vehicle changes its owner's vehicleCount, but the customer list is
      // a different screen — and the owner dropdown in this very form subscribes
      // to it, so refetching would reload the dropdown the user just used.
      invalidateInBackground(queryClient, [customerApi.getCustomerList.actionName])
      invalidateInBackground(queryClient, [customerApi.getCustomerVehicles.actionName])
      toast.success(res?.data?.message ?? 'Vehicle added')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add vehicle'),
  })
}

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [vehicleApi.updateVehicle.actionName],
    mutationFn: ({ id, ...requestData }: VehicleFormType & { id: string }) =>
      initApiRequest<IVehicle>({
        apiDetails: vehicleApi.updateVehicle,
        pathVariables: { id },
        requestData,
      }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [vehicleApi.getVehicleList.actionName] })
      // The response is the saved row in the same envelope the detail query
      // caches — no need to re-read it.
      queryClient.setQueryData([vehicleApi.getVehicleById.actionName, variables.id], res)
      invalidateInBackground(queryClient, [customerApi.getCustomerList.actionName])
      invalidateInBackground(queryClient, [customerApi.getCustomerVehicles.actionName])
      toast.success(res?.data?.message ?? 'Vehicle updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update vehicle'),
  })
}

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [vehicleApi.deleteVehicle.actionName],
    mutationFn: (id: string) =>
      initApiRequest<null>({ apiDetails: vehicleApi.deleteVehicle, pathVariables: { id } }),
    onSuccess: (res, id) => {
      // Deleting a vehicle also deletes its job cards, so the job lists and the
      // dashboard counts move too — but only the vehicle list is on screen, so
      // only it is refetched. This was an argument-less invalidateQueries(),
      // which refetched every active query in the app.
      queryClient.invalidateQueries({ queryKey: [vehicleApi.getVehicleList.actionName] })

      queryClient.removeQueries({ queryKey: [vehicleApi.getVehicleById.actionName, id] })

      for (const key of [
        jobCardApi.getJobCardList.actionName,
        customerApi.getCustomerList.actionName,
        customerApi.getCustomerVehicles.actionName,
        dashboardApi.getDashboardSummary.actionName,
      ])
        invalidateInBackground(queryClient, [key])

      toast.success(res?.data?.message ?? 'Vehicle deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete vehicle'),
  })
}
