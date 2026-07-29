import { RequestMethod } from '@/lib/api-types'

// ── Service catalogue endpoints ──────────────────────────────────────────────
// Reading is open to every signed-in user because all three clients need the
// price list. Writing is staff only — a mechanic may put a wash on a car, but
// not decide what a wash costs.

export const serviceApi = {
  getServiceList: {
    actionName: 'GET_SERVICE_LIST',
    controllerName: '/services',
    requestMethod: RequestMethod.GET,
  },

  getServiceById: {
    actionName: 'GET_SERVICE_BY_ID',
    controllerName: '/services/{id}',
    requestMethod: RequestMethod.GET,
  },

  addService: {
    actionName: 'ADD_SERVICE',
    controllerName: '/services',
    requestMethod: RequestMethod.POST,
  },

  updateService: {
    actionName: 'UPDATE_SERVICE',
    controllerName: '/services/{id}',
    requestMethod: RequestMethod.PUT,
  },

  deleteService: {
    actionName: 'DELETE_SERVICE',
    controllerName: '/services/{id}',
    requestMethod: RequestMethod.DELETE,
  },

  /** Appends catalogue services to an existing job card — never replaces its lines. */
  addServicesToJob: {
    actionName: 'ADD_SERVICES_TO_JOB',
    controllerName: '/job-cards/{id}/services',
    requestMethod: RequestMethod.POST,
  },
} as const
