import { RequestMethod } from '@/lib/api-types'

// ── Invoice endpoints ────────────────────────────────────────────────────────

export const invoiceApi = {
  getInvoiceList: {
    actionName: 'GET_INVOICE_LIST',
    controllerName: '/invoices',
    requestMethod: RequestMethod.GET,
  },

  /** Billing totals across every invoice — independent of the table's paging. */
  getInvoiceSummary: {
    actionName: 'GET_INVOICE_SUMMARY',
    controllerName: '/invoices/summary',
    requestMethod: RequestMethod.GET,
  },

  /** What came in as cash, online and through the bank — the end-of-day question. */
  getCollections: {
    actionName: 'GET_COLLECTIONS',
    controllerName: '/invoices/collections',
    requestMethod: RequestMethod.GET,
  },

  getInvoiceById: {
    actionName: 'GET_INVOICE_BY_ID',
    controllerName: '/invoices/{id}',
    requestMethod: RequestMethod.GET,
  },

  getInvoicePayments: {
    actionName: 'GET_INVOICE_PAYMENTS',
    controllerName: '/invoices/{id}/payments',
    requestMethod: RequestMethod.GET,
  },

  /**
   * The whole bill in one call — invoice, customer contact, vehicle, job lines
   * and payments. The print window uses this rather than four separate requests,
   * so the document either renders complete or not at all.
   */
  getInvoicePrint: {
    actionName: 'GET_INVOICE_PRINT',
    controllerName: '/invoices/{id}/print',
    requestMethod: RequestMethod.GET,
  },

  addInvoice: {
    actionName: 'ADD_INVOICE',
    controllerName: '/invoices',
    requestMethod: RequestMethod.POST,
  },

  updateInvoice: {
    actionName: 'UPDATE_INVOICE',
    controllerName: '/invoices/{id}',
    requestMethod: RequestMethod.PUT,
  },

  /** Records money actually received; the server clamps it to the balance. */
  recordPayment: {
    actionName: 'RECORD_INVOICE_PAYMENT',
    controllerName: '/invoices/{id}/payments',
    requestMethod: RequestMethod.POST,
  },

  deleteInvoice: {
    actionName: 'DELETE_INVOICE',
    controllerName: '/invoices/{id}',
    requestMethod: RequestMethod.DELETE,
  },
} as const
