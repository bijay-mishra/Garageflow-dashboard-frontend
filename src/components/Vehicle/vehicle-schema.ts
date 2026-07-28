import * as Yup from 'yup'

// ── Vehicle contract ─────────────────────────────────────────────────────────

/** Matches `Vocabulary.FuelTypes` on the .NET side — the API rejects anything else. */
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'] as const

export type FuelType = (typeof FUEL_TYPES)[number]

/**
 * Body class. Matches `Vocabulary.VehicleTypes` on the .NET side.
 *
 * SUVs and jeeps are filed under `Car` — the distinction that earns its keep in
 * a workshop is light-vs-heavy, and a separate SUV row only blurs it.
 */
export const VEHICLE_TYPES = ['Bike', 'Car', 'Van', 'Bus', 'Truck', 'Tractor'] as const

export type VehicleType = (typeof VEHICLE_TYPES)[number]

/** A vehicle as `GET /api/vehicles` returns it. */
export interface IVehicle {
  id: string
  customerId: string
  /** Owner's name, denormalised server-side for list views. */
  customerName: string
  make: string
  model: string
  year: number
  plate: string
  vin: string
  type: VehicleType
  fuel: FuelType
  /** Last recorded reading, in km. */
  odometer: number
  color: string
  /** Completion date of the most recent finished job, or null. */
  lastServiceDate: string | null
}

/** Cars built before this are vintage, not workshop stock. */
const EARLIEST_YEAR = 1900

export const vehicleFormSchema = Yup.object({
  customerId: Yup.string().required('Owner is required'),
  make: Yup.string().trim().required('Make is required').max(80, 'Make is too long'),
  model: Yup.string().trim().required('Model is required').max(80, 'Model is too long'),
  year: Yup.number()
    .typeError('Year must be a number')
    .required('Year is required')
    .integer('Year must be a whole number')
    .min(EARLIEST_YEAR, `Year must be ${EARLIEST_YEAR} or later`)
    // Next year's models arrive before the year does.
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  plate: Yup.string().trim().required('Number plate is required').max(40, 'Plate is too long'),
  vin: Yup.string().trim().max(40, 'VIN is too long').default(''),
  type: Yup.string().oneOf(VEHICLE_TYPES, 'Choose a vehicle type').required('Vehicle type is required'),
  fuel: Yup.string().oneOf(FUEL_TYPES, 'Choose a fuel type').required('Fuel is required'),
  odometer: Yup.number()
    .typeError('Odometer must be a number')
    .required('Odometer is required')
    .integer('Odometer must be a whole number')
    .min(0, 'Odometer cannot be negative'),
  color: Yup.string().trim().max(40, 'Colour is too long').default(''),
})

export type VehicleFormType = Yup.InferType<typeof vehicleFormSchema>

export const vehicleInitialValues: VehicleFormType = {
  customerId: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  plate: '',
  vin: '',
  type: 'Car',
  fuel: 'Petrol',
  odometer: 0,
  color: '',
}

export const toVehicleFormValues = (vehicle?: IVehicle, defaultCustomerId?: string): VehicleFormType =>
  vehicle
    ? {
        customerId: vehicle.customerId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        plate: vehicle.plate,
        vin: vehicle.vin,
        type: vehicle.type,
        fuel: vehicle.fuel,
        odometer: vehicle.odometer,
        color: vehicle.color,
      }
    : { ...vehicleInitialValues, customerId: defaultCustomerId ?? '' }
