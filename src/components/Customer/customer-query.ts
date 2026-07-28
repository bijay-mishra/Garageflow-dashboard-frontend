import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { useToast } from '@/context/ToastContext'
import type { IVehicle } from '@/components/Vehicle/vehicle-schema'
import { customerApi } from './customer-api'
import type { CustomerFormType, ICustomer } from './customer-schema'

// ── Customer queries ─────────────────────────────────────────────────────────
// Every response is the `{ data, status, message }` envelope, so the payload is
// at `res?.data?.data`. List endpoints wrap it once more in `{ count, list }`.
//
// Mutations show the server's `message` rather than a hardcoded string — the
// API decides the wording; the fallback only covers a response with none.

export const useGetCustomerList = (enabled = true) =>
  useQuery({
    queryKey: [customerApi.getCustomerList.actionName],
    queryFn: () =>
      initApiRequest<PaginatedResponse<ICustomer>>({ apiDetails: customerApi.getCustomerList }),
    enabled,
    select: (res) => res?.data?.data?.list ?? [],
  })

/**
 * Server-paged list for a server-mode DataTable.
 *
 * `count` is the full total, so the pager can size itself from this one
 * response. `keepPreviousData` holds the current page on screen while the next
 * one loads, instead of flashing an empty table.
 */
export const useGetCustomerListPaged = (params: IPaginationParams, enabled = true) =>
  useQuery({
    queryKey: [customerApi.getCustomerList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<ICustomer>>({
        apiDetails: customerApi.getCustomerList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

/**
 * Fetches every row matching the current filter, ignoring paging — for CSV
 * export, which should cover the whole result set rather than the page on
 * screen. Returns a function so it runs on click, not on render.
 */
export const useFetchAllCustomers = () => {
  const queryClient = useQueryClient()

  return (params: IPaginationParams = {}) =>
    queryClient
      .fetchQuery({
        queryKey: [customerApi.getCustomerList.actionName, 'export', params],
        queryFn: () =>
          initApiRequest<PaginatedResponse<ICustomer>>({
            apiDetails: customerApi.getCustomerList,
            params: { ...params, skip: undefined, take: undefined },
          }),
        staleTime: 0,
      })
      .then((res) => res?.data?.data?.list ?? [])
}

export const useGetCustomerById = (id: string | null) =>
  useQuery({
    queryKey: [customerApi.getCustomerById.actionName, id],
    queryFn: () =>
      initApiRequest<ICustomer>({
        apiDetails: customerApi.getCustomerById,
        pathVariables: { id: id as string },
      }),
    enabled: !!id,
    select: (res) => res?.data?.data ?? null,
  })

/** Vehicles belonging to one customer. */
export const useGetCustomerVehicles = (customerId: string | null) =>
  useQuery({
    queryKey: [customerApi.getCustomerVehicles.actionName, customerId],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IVehicle>>({
        apiDetails: customerApi.getCustomerVehicles,
        pathVariables: { id: customerId as string },
      }),
    enabled: !!customerId,
    select: (res) => res?.data?.data?.list ?? [],
  })

export const useAddCustomer = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [customerApi.addCustomer.actionName],
    mutationFn: (requestData: CustomerFormType) =>
      initApiRequest<ICustomer>({ apiDetails: customerApi.addCustomer, requestData }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [customerApi.getCustomerList.actionName] })
      queryClient.invalidateQueries({ queryKey: ['GET_DASHBOARD_SUMMARY'] })
      toast.success(res?.data?.message ?? 'Customer added')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not add customer'),
  })
}

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [customerApi.updateCustomer.actionName],
    // The API treats PUT as a patch — only the fields sent are applied.
    mutationFn: ({ id, ...requestData }: CustomerFormType & { id: string }) =>
      initApiRequest<ICustomer>({
        apiDetails: customerApi.updateCustomer,
        pathVariables: { id },
        requestData,
      }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: [customerApi.getCustomerList.actionName] })
      queryClient.invalidateQueries({ queryKey: [customerApi.getCustomerById.actionName, variables.id] })
      toast.success(res?.data?.message ?? 'Customer updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update customer'),
  })
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: [customerApi.deleteCustomer.actionName],
    mutationFn: (id: string) =>
      initApiRequest<null>({ apiDetails: customerApi.deleteCustomer, pathVariables: { id } }),
    onSuccess: (res) => {
      // Deleting a customer cascades to their vehicles, job cards and invoices,
      // so every list is stale, not just this one.
      queryClient.invalidateQueries()
      toast.success(res?.data?.message ?? 'Customer deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete customer'),
  })
}
