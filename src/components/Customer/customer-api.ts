import { RequestMethod } from '@/lib/api-types'

// ── Customer endpoints ───────────────────────────────────────────────────────
// `controllerName` is relative to the API root; lib/api-schema.ts resolves the
// origin per request from config.json. `actionName` doubles as the React Query
// key, so it has to stay unique across the app.

export const customerApi = {
  getCustomerList: {
    actionName: 'GET_CUSTOMER_LIST',
    controllerName: '/customers',
    requestMethod: RequestMethod.GET,
  },

  getCustomerById: {
    actionName: 'GET_CUSTOMER_BY_ID',
    controllerName: '/customers/{id}',
    requestMethod: RequestMethod.GET,
  },

  getCustomerVehicles: {
    actionName: 'GET_CUSTOMER_VEHICLES',
    controllerName: '/customers/{id}/vehicles',
    requestMethod: RequestMethod.GET,
  },

  addCustomer: {
    actionName: 'ADD_CUSTOMER',
    controllerName: '/customers',
    requestMethod: RequestMethod.POST,
  },

  updateCustomer: {
    actionName: 'UPDATE_CUSTOMER',
    controllerName: '/customers/{id}',
    requestMethod: RequestMethod.PUT,
  },

  deleteCustomer: {
    actionName: 'DELETE_CUSTOMER',
    controllerName: '/customers/{id}',
    requestMethod: RequestMethod.DELETE,
  },
} as const
