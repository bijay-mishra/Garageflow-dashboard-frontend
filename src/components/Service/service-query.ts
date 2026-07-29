import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { invalidateInBackground } from '@/lib/queryClient'
import { useToast } from '@/context/ToastContext'
import { jobCardApi } from '@/components/JobCard/jobcard-api'
import type { IJobCard } from '@/components/JobCard/jobcard-schema'
import type { VehicleType } from '@/components/Vehicle/vehicle-schema'
import { serviceApi } from './service-api'
import type { IService, ServiceCategory, ServiceFormType } from './service-schema'

/** Extra filters the service list accepts on top of paging. */
export interface ServiceListParams extends IPaginationParams {
  category?: ServiceCategory
  /** Narrows to what is offered for this body class. Unrestricted rows always match. */
  vehicleType?: VehicleType
  /** Hides retired rows. */
  activeOnly?: boolean
}

/**
 * The whole price list, unpaged — for the pickers that offer it.
 *
 * `activeOnly` defaults to true here and nowhere else: a picker must never
 * offer a service the shop has retired, while the Services screen itself has to
 * show retired rows so they can be brought back.
 */
export const useGetServiceList = (enabled = true, activeOnly = true) =>
  useQuery({
    queryKey: [serviceApi.getServiceList.actionName, { activeOnly }],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IService>>({
        apiDetails: serviceApi.getServiceList,
        params: { activeOnly },
      }),
    enabled,
    // A price list changes a few times a year, and every job card form reads it.
    staleTime: 5 * 60 * 1000,
    select: (res) => res?.data?.data?.list ?? [],
  })

export const useGetServiceListPaged = (params: ServiceListParams, enabled = true) =>
  useQuery({
    queryKey: [serviceApi.getServiceList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IService>>({
        apiDetails: serviceApi.getServiceList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

/** Every row matching the filter, ignoring paging — for CSV export. */
export const useFetchAllServices = () => {
  const queryClient = useQueryClient()

  return (params: ServiceListParams = {}) =>
    queryClient
      .fetchQuery({
        queryKey: [serviceApi.getServiceList.actionName, 'export', params],
        queryFn: () =>
          initApiRequest<PaginatedResponse<IService>>({
            apiDetails: serviceApi.getServiceList,
            params: { ...params, skip: undefined, take: undefined },
          }),
        staleTime: 0,
      })
      .then((res) => res?.data?.data?.list ?? [])
}

export const useGetServiceById = (id: string | null) =>
  useQuery({
    queryKey: [serviceApi.getServiceById.actionName, id],
    queryFn: () =>
      initApiRequest<IService>({
        apiDetails: serviceApi.getServiceById,
        pathVariables: { id: id as string },
      }),
    enabled: !!id,
    select: (res) => res?.data?.data ?? null,
  })

export const useAddService = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [serviceApi.addService.actionName],
    mutationFn: (requestData: ServiceFormType) =>
      initApiRequest<IService>({ apiDetails: serviceApi.addService, requestData }),
    onSuccess: (res) => {
      // Refetches every service query, paged and unpaged, because the pickers on
      // other screens are exactly what a new service is for.
      queryClient.invalidateQueries({ queryKey: [serviceApi.getServiceList.actionName] })
      toast.success(res?.data?.message ?? 'Service added')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add service'),
  })
}

export const useUpdateService = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [serviceApi.updateService.actionName],
    mutationFn: ({ id, ...requestData }: Partial<ServiceFormType> & { id: string }) =>
      initApiRequest<IService>({
        apiDetails: serviceApi.updateService,
        pathVariables: { id },
        requestData,
      }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [serviceApi.getServiceList.actionName] })
      queryClient.setQueryData([serviceApi.getServiceById.actionName, variables.id], res)
      toast.success(res?.data?.message ?? 'Service updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update service'),
  })
}

export const useDeleteService = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [serviceApi.deleteService.actionName],
    mutationFn: (id: string) =>
      initApiRequest<null>({ apiDetails: serviceApi.deleteService, pathVariables: { id } }),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: [serviceApi.getServiceList.actionName] })
      queryClient.removeQueries({ queryKey: [serviceApi.getServiceById.actionName, id] })
      toast.success(res?.data?.message ?? 'Service removed')
    },
    // The API refuses to delete a service that has been sold and says so in the
    // message — that sentence is the whole point, so it is shown verbatim rather
    // than replaced with a generic failure.
    onError: (error: Error) => toast.error(error.message || 'Could not remove service'),
  })
}

/**
 * Adds catalogue services to a job card that already exists.
 *
 * Deliberately not part of the job card update: `PUT /job-cards/{id}` replaces
 * the entire line set, so a form holding a stale copy would wipe whatever the
 * mechanic added from the app. This only ever appends.
 */
export const useAddServicesToJob = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [serviceApi.addServicesToJob.actionName],
    mutationFn: ({ id, serviceIds }: { id: string; serviceIds: string[] }) =>
      initApiRequest<IJobCard>({
        apiDetails: serviceApi.addServicesToJob,
        pathVariables: { id },
        requestData: { serviceIds },
      }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [jobCardApi.getJobCardList.actionName] })
      queryClient.setQueryData([jobCardApi.getJobCardById.actionName, variables.id], res)
      // The usage count on the Services screen moves, but that screen is not the
      // one in front of the user.
      invalidateInBackground(queryClient, [serviceApi.getServiceList.actionName])
      toast.success(res?.data?.message ?? 'Services added')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add services'),
  })
}
