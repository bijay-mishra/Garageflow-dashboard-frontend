import { RequestMethod } from '@/lib/api-types'

// ── Vehicle endpoints ────────────────────────────────────────────────────────
// Vehicles owned by a specific customer come from the Customer feature instead:
// see `customerApi.getCustomerVehicles`.

export const vehicleApi = {
  getVehicleList: {
    actionName: 'GET_VEHICLE_LIST',
    controllerName: '/vehicles',
    requestMethod: RequestMethod.GET,
  },

  getVehicleById: {
    actionName: 'GET_VEHICLE_BY_ID',
    controllerName: '/vehicles/{id}',
    requestMethod: RequestMethod.GET,
  },

  addVehicle: {
    actionName: 'ADD_VEHICLE',
    controllerName: '/vehicles',
    requestMethod: RequestMethod.POST,
  },

  updateVehicle: {
    actionName: 'UPDATE_VEHICLE',
    controllerName: '/vehicles/{id}',
    requestMethod: RequestMethod.PUT,
  },

  deleteVehicle: {
    actionName: 'DELETE_VEHICLE',
    controllerName: '/vehicles/{id}',
    requestMethod: RequestMethod.DELETE,
  },
} as const
