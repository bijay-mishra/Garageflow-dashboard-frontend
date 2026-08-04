import { useMemo } from 'react'
import { FormikProvider, useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import DateInput from '@/components/common/form/DateInput'
import FormikDropdown from '@/components/common/form/FormikDropdown'
import { Spinner } from '@/components/common/loaders/States'
import { useGetVehicleList } from '@/components/Vehicle/vehicle-query'
import { useGetMechanicList } from '@/components/Staff/staff-query'
import JobLinesField from './JobLinesField'
import { useAddJobCard, useUpdateJobCard } from './jobcard-query'
import {
  JOB_PRIORITIES,
  JOB_STATUSES,
  MECHANICS,
  jobCardFormSchema,
  jobLinesTotal,
  toJobCardFormValues,
  type IJobCard,
  type JobCardFormType,
} from './jobcard-schema'
import { formatRs } from '@/lib/format'

interface JobCardFormProps {
  editing?: IJobCard
  onClose: () => void
}

export default function JobCardForm({ editing, onClose }: JobCardFormProps) {
  const { data: vehicles = [], isLoading: loadingVehicles } = useGetVehicleList()
  const addJobCard = useAddJobCard()
  const updateJobCard = useUpdateJobCard()

  const formik = useFormik<JobCardFormType>({
    initialValues: toJobCardFormValues(editing),
    validationSchema: jobCardFormSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        if (editing) await updateJobCard.mutateAsync({ id: editing.id, ...values })
        else await addJobCard.mutateAsync(values)
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        label: v.plate,
        value: v.id,
        detail: `${v.make} ${v.model} · ${v.customerName}`,
      })),
    [vehicles],
  )

  // Drives which services the price-list picker leads with — a bike wash and a
  // bus wash are different rows, and offering both for a scooter is noise.
  const vehicleType = useMemo(
    () => vehicles.find((v) => v.id === formik.values.vehicleId)?.type,
    [vehicles, formik.values.vehicleId],
  )

  // Real mechanic accounts, falling back to the hardcoded list only while none
  // exist. This is the loop that matters: a name assigned here has to match a
  // login created on the Staff screen, or the job is invisible in the app.
  const { data: mechanics = [] } = useGetMechanicList()

  const mechanicOptions = useMemo(
    () => (mechanics.length > 0 ? mechanics : MECHANICS).map((m) => ({ label: m, value: m })),
    [mechanics],
  )
  const priorityOptions = useMemo(() => JOB_PRIORITIES.map((p) => ({ label: p, value: p })), [])
  const statusOptions = useMemo(() => JOB_STATUSES.map((s) => ({ label: s, value: s })), [])

  const busy = addJobCard.isPending || updateJobCard.isPending

  return (
    // `useFormik` returns the form bag but publishes no React context, and the
    // <FieldArray> inside JobLinesField reads Formik from context — without this
    // provider it throws on first render and blanks the page. This is the only
    // form here with a repeating field group, hence the only one that needs it.
    <FormikProvider value={formik}>
      <Modal
        title={editing ? 'Edit job card' : 'Add job card'}
        onClose={onClose}
        maxWidth="max-w-2xl"
        footer={
          <>
            <div className="mr-auto text-sm">
              <span className="text-ink-400">Estimated total </span>
              <span className="font-bold text-ink-900">{formatRs(jobLinesTotal(formik.values.lines ?? []))}</span>
            </div>
            <button className="btn-ghost" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn-primary" onClick={() => formik.handleSubmit()} disabled={busy} type="button">
              {busy && <Spinner />} {editing ? 'Save changes' : 'Create job card'}
            </button>
          </>
        }
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormikDropdown
              name="vehicleId"
              label="Vehicle"
              formik={formik}
              options={vehicleOptions}
              isLoading={loadingVehicles}
              placeholder="Select vehicle…"
              isRequired
              // The vehicle fixes the customer and the plate, so it is set once.
              disabled={!!editing}
              onSelect={(value) => {
                // Opening a job is when the current mileage gets recorded.
                const vehicle = vehicles.find((v) => v.id === value)
                if (vehicle) formik.setFieldValue('odometer', vehicle.odometer)
              }}
            />
            <FormikDropdown
              name="mechanic"
              label="Assigned mechanic"
              formik={formik}
              options={mechanicOptions}
              isClearable={false}
            />
          </div>

          <div>
            <label htmlFor="complaint" className="mb-1.5 block text-xs font-semibold text-ink-600">
              Complaint / work requested<span className="ml-0.5 text-rose-500">*</span>
            </label>
            <textarea
              id="complaint"
              name="complaint"
              className="input min-h-[72px] resize-y"
              value={formik.values.complaint}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Describe the customer complaint or requested service…"
            />
            {formik.errors.complaint && (formik.touched.complaint || formik.submitCount > 0) && (
              <p className="mt-1 text-xs font-medium text-rose-600">{formik.errors.complaint}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FormikDropdown name="priority" label="Priority" formik={formik} options={priorityOptions} isClearable={false} />
            {/* Status is server-driven on create (always Open), so it only shows when editing. */}
            {editing && (
              <FormikDropdown name="status" label="Status" formik={formik} options={statusOptions} isClearable={false} />
            )}
            <Input name="odometer" label="Odometer (km)" type="number" formik={formik} min={0} isRequired />
            {/* Typed and picked in BS or AD — the flag button on the field
                switches, and every date on screen follows. Either way the value
                on the form is an ISO Gregorian day, so nothing downstream
                changes. */}
            {/* Two columns: a date plus its calendar controls does not fit the
                width a priority dropdown needs. */}
            <DateInput
              name="promisedAt"
              label="Promised date"
              formik={formik}
              isRequired
              className="sm:col-span-2"
            />
          </div>

          <JobLinesField formik={formik} vehicleType={vehicleType} />

          <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </form>
      </Modal>
    </FormikProvider>
  )
}
