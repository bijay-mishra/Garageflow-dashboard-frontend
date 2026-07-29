import { useMemo } from 'react'
import { useFormik } from 'formik'
import clsx from 'clsx'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import FormikDropdown from '@/components/common/form/FormikDropdown'
import { Spinner } from '@/components/common/loaders/States'
import { VEHICLE_TYPES, type VehicleType } from '@/components/Vehicle/vehicle-schema'
import { useAddService, useUpdateService } from './service-query'
import {
  SERVICE_CATEGORIES,
  serviceFormSchema,
  toServiceFormValues,
  type IService,
  type ServiceFormType,
} from './service-schema'

interface ServiceFormProps {
  editing?: IService
  onClose: () => void
}

export default function ServiceForm({ editing, onClose }: ServiceFormProps) {
  const addService = useAddService()
  const updateService = useUpdateService()

  const formik = useFormik<ServiceFormType>({
    initialValues: toServiceFormValues(editing),
    validationSchema: serviceFormSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        if (editing) await updateService.mutateAsync({ id: editing.id, ...values })
        else await addService.mutateAsync(values)
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const categoryOptions = useMemo(() => SERVICE_CATEGORIES.map((c) => ({ label: c, value: c })), [])

  const appliesTo = (formik.values.appliesTo ?? []) as VehicleType[]

  const toggleVehicleType = (type: VehicleType) =>
    formik.setFieldValue(
      'appliesTo',
      appliesTo.includes(type) ? appliesTo.filter((t) => t !== type) : [...appliesTo, type],
    )

  const busy = addService.isPending || updateService.isPending

  return (
    <Modal
      title={editing ? 'Edit service' : 'Add service'}
      onClose={onClose}
      maxWidth="max-w-xl"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn-primary" onClick={() => formik.handleSubmit()} disabled={busy} type="button">
            {busy && <Spinner />} {editing ? 'Save changes' : 'Add service'}
          </button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input name="name" label="Service name" formik={formik} placeholder="Car wash — full" isRequired />

        <div>
          <label htmlFor="description" className="mb-1.5 block text-xs font-semibold text-ink-600">
            What it includes
          </label>
          <textarea
            id="description"
            name="description"
            className="input min-h-[64px] resize-y"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="Foam wash, wheels, interior vacuum and dashboard wipe."
          />
          {formik.errors.description && (formik.touched.description || formik.submitCount > 0) && (
            <p className="mt-1 text-xs font-medium text-rose-600">{formik.errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormikDropdown
            name="category"
            label="Category"
            formik={formik}
            options={categoryOptions}
            isClearable={false}
          />
          <Input name="price" label="Price (Rs)" type="number" formik={formik} min={0} isRequired />
          <Input
            name="durationMinutes"
            label="Bay time (min)"
            type="number"
            formik={formik}
            min={0}
            isRequired
          />
        </div>

        {/* Applicability. Nothing selected is a real, useful state — it means the
            service is offered for every vehicle — so this is a set of toggles
            rather than a required multi-select. */}
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-600">Offered for</span>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((type) => {
              const on = appliesTo.includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleVehicleType(type)}
                  className={clsx(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                    on
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-500 hover:border-ink-300 hover:text-ink-700',
                  )}
                >
                  {type}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-xs text-ink-400">
            {appliesTo.length === 0
              ? 'Nothing selected — offered for every vehicle.'
              : `Only offered for ${appliesTo.join(', ').toLowerCase()}.`}
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-ink-100 bg-ink-50 p-3">
          <Toggle
            label="Customers can book this in the app"
            hint="Turn off for extras the workshop adds itself, like a courtesy wash."
            checked={formik.values.isBookable}
            onChange={(value) => formik.setFieldValue('isBookable', value)}
          />
          <Toggle
            label="Currently offered"
            hint="Turning this off retires the service. It stays on past jobs and stops appearing in pickers."
            checked={formik.values.isActive}
            onChange={(value) => formik.setFieldValue('isActive', value)}
          />
        </div>

        {/* Only meaningful once the service has been sold, and the reason the
            table shows a usage count at all. */}
        {editing && editing.timesUsed > 0 && (
          <p className="text-xs text-ink-400">
            On {editing.timesUsed} job card{editing.timesUsed === 1 ? '' : 's'}. Changing the price here
            does not change what those were charged.
          </p>
        )}

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}

/** A labelled checkbox with a line of explanation under it. */
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
      />
      <span>
        <span className="block text-xs font-semibold text-ink-700">{label}</span>
        <span className="block text-xs text-ink-400">{hint}</span>
      </span>
    </label>
  )
}
