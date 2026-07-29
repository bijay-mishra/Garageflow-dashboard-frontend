import { lazy, Suspense } from 'react'
import { useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import { Spinner } from '@/components/common/loaders/States'
import { useAddCustomer, useUpdateCustomer } from './customer-query'
import { customerFormSchema, toCustomerFormValues, type CustomerFormType, type ICustomer } from './customer-schema'

// Leaflet plus its stylesheet is ~180KB, and it is only reachable from this
// dialog and the customers map. Imported lazily so it costs nothing on the
// visits — most of them — that never open either.
const LocationPicker = lazy(() => import('@/components/common/map/LocationPicker'))

interface CustomerFormProps {
  /** Omit to add; pass a customer to edit it. */
  editing?: ICustomer
  onClose: () => void
}

/** Add/edit customer dialog. Validation comes from `customerFormSchema`. */
export default function CustomerForm({ editing, onClose }: CustomerFormProps) {
  const addCustomer = useAddCustomer()
  const updateCustomer = useUpdateCustomer()

  const formik = useFormik<CustomerFormType>({
    initialValues: toCustomerFormValues(editing),
    validationSchema: customerFormSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      // The mutations already toast on failure, so a rejection here only needs
      // to keep the dialog open for another try.
      try {
        if (editing) {
          // The server treats an absent or null coordinate as "leave it alone",
          // so removing a pin has to be said explicitly — otherwise clearing it
          // in the form would appear to work and change nothing.
          const clearLocation = editing.latitude != null && values.latitude == null
          await updateCustomer.mutateAsync({ id: editing.id, ...values, clearLocation })
        } else {
          await addCustomer.mutateAsync(values)
        }
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const pin =
    formik.values.latitude != null && formik.values.longitude != null
      ? { lat: formik.values.latitude, lng: formik.values.longitude }
      : null

  const busy = addCustomer.isPending || updateCustomer.isPending

  return (
    <Modal
      title={editing ? 'Edit customer' : 'Add customer'}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" onClick={() => formik.handleSubmit()} disabled={busy} type="button">
            {busy && <Spinner />} {editing ? 'Save changes' : 'Add customer'}
          </button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input name="name" label="Full name" formik={formik} placeholder="e.g. Ramesh Shrestha" isRequired />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="phone" label="Phone" type="tel" formik={formik} placeholder="+977 98…" isRequired />
          <Input name="email" label="Email" type="email" formik={formik} placeholder="name@email.com" />
        </div>

        <Input name="address" label="Address" formik={formik} placeholder="City / area" />

        <Suspense
          fallback={
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-ink-200">
              <Spinner />
            </div>
          }
        >
          <LocationPicker
            value={pin}
            // Feeds the search box, so typing "Kirtipur, Kathmandu" above drops
            // the pin without anyone hunting for it on the map.
            address={formik.values.address}
            onChange={(next) => {
              // Set together or cleared together — half a coordinate pair puts a
              // marker on the equator, and the server rejects it anyway.
              formik.setFieldValue('latitude', next?.lat ?? null)
              formik.setFieldValue('longitude', next?.lng ?? null)
            }}
          />
        </Suspense>

        {/* Lets Enter submit the form without a visible second button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
