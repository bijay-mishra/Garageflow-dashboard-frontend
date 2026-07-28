import { useMemo } from 'react'
import { useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import FormikDropdown from '@/components/common/form/FormikDropdown'
import { Spinner } from '@/components/common/loaders/States'
import { useGetVehicleList } from '@/components/Vehicle/vehicle-query'
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

  const mechanicOptions = useMemo(() => MECHANICS.map((m) => ({ label: m, value: m })), [])
  const priorityOptions = useMemo(() => JOB_PRIORITIES.map((p) => ({ label: p, value: p })), [])
  const statusOptions = useMemo(() => JOB_STATUSES.map((s) => ({ label: s, value: s })), [])

  const busy = addJobCard.isPending || updateJobCard.isPending

  return (
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
          <Input name="promisedAt" label="Promised date" type="date" formik={formik} isRequired />
        </div>

        <JobLinesField formik={formik} />

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
