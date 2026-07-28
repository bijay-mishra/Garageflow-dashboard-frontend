import { useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import { Spinner } from '@/components/common/loaders/States'
import { useAddCustomer, useUpdateCustomer } from './customer-query'
import { customerFormSchema, toCustomerFormValues, type CustomerFormType, type ICustomer } from './customer-schema'

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
        if (editing) await updateCustomer.mutateAsync({ id: editing.id, ...values })
        else await addCustomer.mutateAsync(values)
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

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

        {/* Lets Enter submit the form without a visible second button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
