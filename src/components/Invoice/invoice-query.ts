import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initApiRequest } from '@/lib/api-request'
import { useToast } from '@/context/ToastContext'
import { customerApi } from '@/components/Customer/customer-api'
import { invoiceApi } from './invoice-api'
import type {
  IAddInvoiceRequest,
  IInvoice,
  IInvoiceSummary,
  IPayment,
  InvoiceStatus,
  PaymentFormType,
} from './invoice-schema'

/** Extra filters the invoice list accepts on top of paging. */
export interface InvoiceListParams extends IPaginationParams {
  status?: InvoiceStatus
}

export const useGetInvoiceList = (enabled = true) =>
  useQuery({
    queryKey: [invoiceApi.getInvoiceList.actionName],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IInvoice>>({ apiDetails: invoiceApi.getInvoiceList }),
    enabled,
    select: (res) => res?.data?.data?.list ?? [],
  })

export const useGetInvoiceListPaged = (params: InvoiceListParams, enabled = true) =>
  useQuery({
    queryKey: [invoiceApi.getInvoiceList.actionName, 'paged', params],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IInvoice>>({
        apiDetails: invoiceApi.getInvoiceList,
        params: { ...params },
      }),
    enabled,
    placeholderData: keepPreviousData,
    select: (res) => res?.data?.data ?? { count: 0, list: [] },
  })

/** All-time billed / collected / outstanding, unaffected by the table's paging. */
export const useGetInvoiceSummary = (enabled = true) =>
  useQuery({
    queryKey: [invoiceApi.getInvoiceSummary.actionName],
    queryFn: () =>
      initApiRequest<IInvoiceSummary>({ apiDetails: invoiceApi.getInvoiceSummary }),
    enabled,
    select: (res) => res?.data?.data ?? null,
  })

/** Every row matching the filter, ignoring paging — for CSV export. */
export const useFetchAllInvoices = () => {
  const queryClient = useQueryClient()

  return (params: InvoiceListParams = {}) =>
    queryClient
      .fetchQuery({
        queryKey: [invoiceApi.getInvoiceList.actionName, 'export', params],
        queryFn: () =>
          initApiRequest<PaginatedResponse<IInvoice>>({
            apiDetails: invoiceApi.getInvoiceList,
            params: { ...params, skip: undefined, take: undefined },
          }),
        staleTime: 0,
      })
      .then((res) => res?.data?.data?.list ?? [])
}

export const useGetInvoiceById = (id: string | null) =>
  useQuery({
    queryKey: [invoiceApi.getInvoiceById.actionName, id],
    queryFn: () =>
      initApiRequest<IInvoice>({
        apiDetails: invoiceApi.getInvoiceById,
        pathVariables: { id: id as string },
      }),
    enabled: !!id,
    select: (res) => res?.data?.data ?? null,
  })

/** Payment history behind an invoice's `paid` figure. */
export const useGetInvoicePayments = (invoiceId: string | null) =>
  useQuery({
    queryKey: [invoiceApi.getInvoicePayments.actionName, invoiceId],
    queryFn: () =>
      initApiRequest<PaginatedResponse<IPayment>>({
        apiDetails: invoiceApi.getInvoicePayments,
        pathVariables: { id: invoiceId as string },
      }),
    enabled: !!invoiceId,
    select: (res) => res?.data?.data?.list ?? [],
  })

/** Billing changes move revenue figures and a customer's lifetime spend. */
const useInvalidateInvoices = () => {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: [invoiceApi.getInvoiceList.actionName] })
    queryClient.invalidateQueries({ queryKey: [invoiceApi.getInvoiceSummary.actionName] })
    queryClient.invalidateQueries({ queryKey: ['GET_DASHBOARD_SUMMARY'] })
    queryClient.invalidateQueries({ queryKey: [customerApi.getCustomerList.actionName] })
  }
}

export const useAddInvoice = () => {
  const invalidate = useInvalidateInvoices()
  const toast = useToast()

  return useMutation({
    mutationKey: [invoiceApi.addInvoice.actionName],
    mutationFn: (requestData: IAddInvoiceRequest) =>
      initApiRequest<IInvoice>({ apiDetails: invoiceApi.addInvoice, requestData }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Invoice created')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not create invoice'),
  })
}

export const useRecordPayment = () => {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateInvoices()
  const toast = useToast()

  return useMutation({
    mutationKey: [invoiceApi.recordPayment.actionName],
    mutationFn: ({ id, ...requestData }: PaymentFormType & { id: string }) =>
      initApiRequest<IInvoice>({
        apiDetails: invoiceApi.recordPayment,
        pathVariables: { id },
        requestData,
      }),
    onSuccess: (res, variables) => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: [invoiceApi.getInvoicePayments.actionName, variables.id] })
      // The server says how much it actually took and what is still due — it
      // clamps overpayment, so its wording is the accurate one.
      toast.success(res?.data?.message ?? 'Payment recorded')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not record payment'),
  })
}

export const useUpdateInvoice = () => {
  const invalidate = useInvalidateInvoices()
  const toast = useToast()

  return useMutation({
    mutationKey: [invoiceApi.updateInvoice.actionName],
    mutationFn: ({ id, ...requestData }: Partial<IAddInvoiceRequest> & { id: string }) =>
      initApiRequest<IInvoice>({
        apiDetails: invoiceApi.updateInvoice,
        pathVariables: { id },
        requestData,
      }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Invoice updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not update invoice'),
  })
}

export const useDeleteInvoice = () => {
  const invalidate = useInvalidateInvoices()
  const toast = useToast()

  return useMutation({
    mutationKey: [invoiceApi.deleteInvoice.actionName],
    mutationFn: (id: string) =>
      initApiRequest<null>({ apiDetails: invoiceApi.deleteInvoice, pathVariables: { id } }),
    onSuccess: (res) => {
      invalidate()
      toast.success(res?.data?.message ?? 'Invoice deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Could not delete invoice'),
  })
}
