import { useMemo } from 'react'
import { useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import FormikDropdown from '@/components/common/form/FormikDropdown'
import { Spinner } from '@/components/common/loaders/States'
import { formatRs } from '@/lib/format'
import { useRecordPayment } from './invoice-query'
import { PAYMENT_METHODS, paymentFormSchema, type IInvoice, type PaymentFormType } from './invoice-schema'

interface PaymentFormProps {
  invoice: IInvoice
  onClose: () => void
}

/** Records money received against an invoice. */
export default function PaymentForm({ invoice, onClose }: PaymentFormProps) {
  const recordPayment = useRecordPayment()
  const due = invoice.total - invoice.paid

  const formik = useFormik<PaymentFormType>({
    // Settling the balance in full is the common case, so it is prefilled.
    initialValues: { amount: due, method: invoice.method ?? 'Cash' },
    validationSchema: useMemo(() => paymentFormSchema(due), [due]),
    onSubmit: async (values) => {
      try {
        await recordPayment.mutateAsync({ id: invoice.id, ...values })
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const methodOptions = useMemo(() => PAYMENT_METHODS.map((m) => ({ label: m, value: m })), [])

  return (
    <Modal
      title="Record payment"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => formik.handleSubmit()}
            disabled={recordPayment.isPending}
            type="button"
          >
            {recordPayment.isPending && <Spinner />} Record {formatRs(formik.values.amount || 0)}
          </button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Total" value={formatRs(invoice.total)} />
          <Stat label="Paid" value={formatRs(invoice.paid)} tone="text-emerald-600" />
          <Stat label="Due" value={formatRs(due)} tone="text-rose-600" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input name="amount" label="Amount" type="number" formik={formik} min={0} max={due} isRequired />
          <FormikDropdown name="method" label="Method" formik={formik} options={methodOptions} isClearable={false} />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn-soft flex-1 py-2 text-xs"
            onClick={() => formik.setFieldValue('amount', due)}
          >
            Full ({formatRs(due)})
          </button>
          <button
            type="button"
            className="btn-soft flex-1 py-2 text-xs"
            onClick={() => formik.setFieldValue('amount', Math.round(due / 2))}
          >
            Half
          </button>
        </div>

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}

function Stat({ label, value, tone = 'text-ink-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-ink-100 bg-ink-50 p-3">
      <p className={`text-sm font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  )
}
