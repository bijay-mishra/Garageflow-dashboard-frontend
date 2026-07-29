import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { RequestMethod } from '@/lib/api-types'
import { useToast } from '@/context/ToastContext'
import type { IStaff, StaffFormType, UserRole } from './staff-schema'

export const staffApi = {
  getStaffList: {
    actionName: 'GET_STAFF_LIST',
    controllerName: '/users',
    requestMethod: RequestMethod.GET,
  },

  addStaff: {
    actionName: 'ADD_STAFF',
    controllerName: '/users',
    requestMethod: RequestMethod.POST,
  },

  updateStaff: {
    actionName: 'UPDATE_STAFF',
    controllerName: '/users/{id}',
    requestMethod: RequestMethod.PUT,
  },

  deleteStaff: {
    actionName: 'DELETE_STAFF',
    controllerName: '/users/{id}',
    requestMethod: RequestMethod.DELETE,
  },
} as const

export interface StaffListParams extends IPaginationParams {
  role?: UserRole
}

export const useGetStaffListPaged = (params: StaffListParams, enabled = true) =>
  useQuery({
    queryKey: [staffApi.getStaffList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IStaff>>({
        apiDetails: staffApi.getStaffList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

/**
 * Every mechanic account, for the "assign a mechanic" dropdowns.
 *
 * Those currently offer a hardcoded list in `jobcard-schema.ts`. This is what
 * replaces it once there is a screen creating the accounts — a name in the
 * dropdown that has no login behind it is a job nobody can see in the app.
 */
export const useGetMechanicList = (enabled = true) =>
  useQuery({
    queryKey: [staffApi.getStaffList.actionName, 'mechanics'],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IStaff>>({
        apiDetails: staffApi.getStaffList,
        params: { role: 'Mechanic' },
      }),
    enabled,
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      (res?.data?.data?.list ?? [])
        .filter((u) => u.isActive && !!u.mechanicName)
        .map((u) => u.mechanicName as string),
  })

const useInvalidateStaff = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [staffApi.getStaffList.actionName] })
}

export const useAddStaff = () => {
  const invalidate = useInvalidateStaff()
  const toast = useToast()

  return useMutation({
    mutationKey: [staffApi.addStaff.actionName],
    mutationFn: (requestData: StaffFormType) =>
      initApiRequest<IStaff>({ apiDetails: staffApi.addStaff, requestData }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Account created')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not create the account'),
  })
}

export const useUpdateStaff = () => {
  const invalidate = useInvalidateStaff()
  const toast = useToast()

  return useMutation({
    mutationKey: [staffApi.updateStaff.actionName],
    mutationFn: ({ id, ...requestData }: Partial<StaffFormType> & { id: string }) =>
      initApiRequest<IStaff>({
        apiDetails: staffApi.updateStaff,
        pathVariables: { id },
        // An empty password means "leave it alone" — sending "" would be read as
        // a reset to an empty password and rejected by the length rule.
        requestData: requestData.password ? requestData : { ...requestData, password: undefined },
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Account updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update the account'),
  })
}

export const useDeleteStaff = () => {
  const invalidate = useInvalidateStaff()
  const toast = useToast()

  return useMutation({
    mutationKey: [staffApi.deleteStaff.actionName],
    mutationFn: (id: string) =>
      initApiRequest<null>({ apiDetails: staffApi.deleteStaff, pathVariables: { id } }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Account removed')
    },
    // The API refuses to delete the last owner, and to delete you. Those
    // sentences are the point, so they are shown as sent.
    onError: (error: Error) => toast.error(error.message || 'Could not remove the account'),
  })
}
