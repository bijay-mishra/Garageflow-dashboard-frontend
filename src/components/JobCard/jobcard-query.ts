import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { useToast } from '@/context/ToastContext'
import { vehicleApi } from '@/components/Vehicle/vehicle-api'
import { jobCardApi } from './jobcard-api'
import type { IJobCard, JobCardFormType, JobStatus } from './jobcard-schema'

/** Extra filters the job card list accepts on top of paging. */
export interface JobCardListParams extends IPaginationParams {
  status?: JobStatus
}

export const useGetJobCardList = (enabled = true) =>
  useQuery({
    queryKey: [jobCardApi.getJobCardList.actionName],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IJobCard>>({ apiDetails: jobCardApi.getJobCardList }),
    enabled,
    select: (res) => res?.data?.data?.list ?? [],
  })

export const useGetJobCardListPaged = (params: JobCardListParams, enabled = true) =>
  useQuery({
    queryKey: [jobCardApi.getJobCardList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IJobCard>>({
        apiDetails: jobCardApi.getJobCardList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

export const useGetJobCardById = (id: string | null) =>
  useQuery({
    queryKey: [jobCardApi.getJobCardById.actionName, id],
    queryFn: () =>
      initApiRequest<IJobCard>({
        apiDetails: jobCardApi.getJobCardById,
        pathVariables: { id: id as string },
      }),
    enabled: !!id,
    select: (res) => res?.data?.data ?? null,
  })

/** Invalidates everything a job card change can move. */
const useInvalidateJobCards = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: [jobCardApi.getJobCardList.actionName] })
    // Job status feeds the dashboard counts, and completing a job updates the
    // vehicle's lastServiceDate.
    queryClient.invalidateQueries({ queryKey: ['GET_DASHBOARD_SUMMARY'] })
    queryClient.invalidateQueries({ queryKey: [vehicleApi.getVehicleList.actionName] })
  }
}

export const useAddJobCard = () => {
  const invalidate = useInvalidateJobCards()
  const toast = useToast()

  return useMutation({
    mutationKey: [jobCardApi.addJobCard.actionName],
    mutationFn: (requestData: JobCardFormType) =>
      initApiRequest<IJobCard>({ apiDetails: jobCardApi.addJobCard, requestData }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Job card created')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not create job card'),
  })
}

export const useUpdateJobCard = () => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateJobCards()
  const toast = useToast()

  return useMutation({
    mutationKey: [jobCardApi.updateJobCard.actionName],
    // PUT is a patch here, so a status-only change can send just `{ status }`.
    mutationFn: ({ id, ...requestData }: Partial<JobCardFormType> & { id: string }) =>
      initApiRequest<IJobCard>({
        apiDetails: jobCardApi.updateJobCard,
        pathVariables: { id },
        requestData,
      }),
    onSuccess: (res, variables) => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: [jobCardApi.getJobCardById.actionName, variables.id] })
      toast.success(res?.data?.message ?? 'Job card updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update job card'),
  })
}

export const useDeleteJobCard = () => {
  const invalidate = useInvalidateJobCards()
  const toast = useToast()

  return useMutation({
    mutationKey: [jobCardApi.deleteJobCard.actionName],
    mutationFn: (id: string) =>
      initApiRequest<null>({ apiDetails: jobCardApi.deleteJobCard, pathVariables: { id } }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Job card deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete job card'),
  })
}
