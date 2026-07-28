import { RequestMethod } from '@/lib/api-types'

// ── Job card endpoints ───────────────────────────────────────────────────────

export const jobCardApi = {
  getJobCardList: {
    actionName: 'GET_JOB_CARD_LIST',
    controllerName: '/job-cards',
    requestMethod: RequestMethod.GET,
  },

  getJobCardById: {
    actionName: 'GET_JOB_CARD_BY_ID',
    controllerName: '/job-cards/{id}',
    requestMethod: RequestMethod.GET,
  },

  addJobCard: {
    actionName: 'ADD_JOB_CARD',
    controllerName: '/job-cards',
    requestMethod: RequestMethod.POST,
  },

  updateJobCard: {
    actionName: 'UPDATE_JOB_CARD',
    controllerName: '/job-cards/{id}',
    requestMethod: RequestMethod.PUT,
  },

  deleteJobCard: {
    actionName: 'DELETE_JOB_CARD',
    controllerName: '/job-cards/{id}',
    requestMethod: RequestMethod.DELETE,
  },
} as const
