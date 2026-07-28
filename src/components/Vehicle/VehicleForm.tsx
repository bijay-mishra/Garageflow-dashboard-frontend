import { useMemo } from 'react'
import { useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import FormikDropdown from '@/components/common/form/FormikDropdown'
import { Spinner } from '@/components/common/loaders/States'
import { useGetCustomerList } from '@/components/Customer/customer-query'
import { useAddVehicle, useUpdateVehicle } from './vehicle-query'
import {
  FUEL_TYPES,
  VEHICLE_TYPES,
  toVehicleFormValues,
  vehicleFormSchema,
  type IVehicle,
  type VehicleFormType,
} from './vehicle-schema'

interface VehicleFormProps {
  editing?: IVehicle
  /** Preselects the owner when adding from a customer's page. */
  defaultCustomerId?: string
  onClose: () => void
}

export default function VehicleForm({ editing, defaultCustomerId, onClose }: VehicleFormProps) {
  const { data: customers = [], isLoading: loadingCustomers } = useGetCustomerList()
  const addVehicle = useAddVehicle()
  const updateVehicle = useUpdateVehicle()

  const formik = useFormik<VehicleFormType>({
    initialValues: toVehicleFormValues(editing, defaultCustomerId),
    validationSchema: vehicleFormSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        if (editing) await updateVehicle.mutateAsync({ id: editing.id, ...values })
        else await addVehicle.mutateAsync(values)
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers],
  )

  const typeOptions = useMemo(() => VEHICLE_TYPES.map((t) => ({ label: t, value: t })), [])
  const fuelOptions = useMemo(() => FUEL_TYPES.map((f) => ({ label: f, value: f })), [])

  const busy = addVehicle.isPending || updateVehicle.isPending

  return (
    <Modal
      title={editing ? 'Edit vehicle' : 'Add vehicle'}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" onClick={() => formik.handleSubmit()} disabled={busy} type="button">
            {busy && <Spinner />} {editing ? 'Save changes' : 'Add vehicle'}
          </button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <FormikDropdown
          name="customerId"
          label="Owner"
          formik={formik}
          options={customerOptions}
          isLoading={loadingCustomers}
          placeholder="Select customer…"
          isRequired
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input name="make" label="Make" formik={formik} placeholder="Toyota" isRequired />
          <Input name="model" label="Model" formik={formik} placeholder="Corolla" isRequired />
          <Input name="year" label="Year" type="number" formik={formik} isRequired />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="plate" label="Number plate" formik={formik} placeholder="BA 12 PA 3456" isRequired />
          <Input name="vin" label="VIN / Chassis" formik={formik} placeholder="Optional" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormikDropdown name="type" label="Type" formik={formik} options={typeOptions} isClearable={false} />
          <FormikDropdown name="fuel" label="Fuel" formik={formik} options={fuelOptions} isClearable={false} />
          <Input name="odometer" label="Odometer (km)" type="number" formik={formik} min={0} isRequired />
          <Input name="color" label="Colour" formik={formik} placeholder="Silver" />
        </div>

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
