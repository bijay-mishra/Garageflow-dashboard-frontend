import { useMemo, useState } from 'react'
import { useFormik } from 'formik'
import Modal from '@/components/common/modals/Modal'
import Input from '@/components/common/form/Input'
import FormikDropdown from '@/components/common/form/FormikDropdown'
import { Spinner } from '@/components/common/loaders/States'
import { useGetJobCardList } from '@/components/JobCard/jobcard-query'
import { workshopInfo } from '@/data/seed'
import { formatRs, todayISO } from '@/lib/format'
import { useAddInvoice, useGetInvoiceDiscounts, useGetInvoiceList } from './invoice-query'
import {
  PAYMENT_METHODS,
  calculateInvoiceTotals,
  invoiceFormSchema,
  invoiceInitialValues,
  type InvoiceFormType,
} from './invoice-schema'

/** Raise an invoice against a completed, un-billed job card. */
export default function InvoiceForm({ onClose }: { onClose: () => void }) {
  const { data: jobs = [], isLoading: loadingJobs } = useGetJobCardList()
  const { data: invoices = [] } = useGetInvoiceList()
  const addInvoice = useAddInvoice()

  // Only finished work that has not already been billed can be invoiced.
  const billable = useMemo(() => {
    const invoiced = new Set(invoices.map((i) => i.jobCardId))
    return jobs.filter((j) => (j.status === 'Completed' || j.status === 'Delivered') && !invoiced.has(j.id))
  }, [jobs, invoices])

  const formik = useFormik<InvoiceFormType>({
    initialValues: invoiceInitialValues(workshopInfo.taxRate),
    validationSchema: invoiceFormSchema,
    onSubmit: async (values) => {
      const job = jobs.find((j) => j.id === values.jobCardId)
      if (!job) return

      const { total } = calculateInvoiceTotals(job.total, values.taxRate)

      try {
        await addInvoice.mutateAsync({
          jobCardId: job.id,
          customerId: job.customerId,
          customerName: job.customerName,
          vehiclePlate: job.vehiclePlate,
          issuedAt: todayISO(),
          subtotal: job.total,
          taxRate: values.taxRate,
          // The server clamps this too, but sending an impossible number and
          // letting it silently shrink would be confusing.
          paid: Math.min(values.paid, total),
          method: values.paid > 0 ? values.method : null,
          // Intent, not amounts. The server works out what each is worth and
          // clamps it — a client that could name a discount could invent one.
          applyOffers: useOffer,
          useLoyaltyReward: useReward,
          pointsToRedeem: usePoints ? (quote?.redeemablePoints ?? 0) : 0,
        })
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const selectedJob = jobs.find((j) => j.id === formik.values.jobCardId)
  const totals = calculateInvoiceTotals(selectedJob?.total ?? 0, formik.values.taxRate)

  // What this customer could have off, fetched once a job is chosen. The
  // advisor has to see "they have a free wash waiting" while they are still
  // deciding, not after the bill is raised.
  const { data: quote } = useGetInvoiceDiscounts(formik.values.jobCardId || null)

  // An offer is the shop's own promotion and applies unless declined; a reward
  // and points are the customer's to spend and are opt-in. Same defaults the
  // API uses, so the preview and the bill agree.
  const [useOffer, setUseOffer] = useState(true)
  const [useReward, setUseReward] = useState(false)
  const [usePoints, setUsePoints] = useState(false)

  const jobOptions = useMemo(
    () =>
      billable.map((j) => ({
        label: `${j.id} · ${formatRs(j.total)}`,
        value: j.id,
        detail: `${j.vehicleLabel} — ${j.customerName}`,
      })),
    [billable],
  )

  const methodOptions = useMemo(() => PAYMENT_METHODS.map((m) => ({ label: m, value: m })), [])

  return (
    <Modal
      title="Add invoice"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => formik.handleSubmit()}
            disabled={addInvoice.isPending}
            type="button"
          >
            {addInvoice.isPending && <Spinner />} Create invoice
          </button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div>
          <FormikDropdown
            name="jobCardId"
            label="Job card"
            formik={formik}
            options={jobOptions}
            isLoading={loadingJobs}
            placeholder="Select a completed job…"
            isRequired
          />
          {!loadingJobs && billable.length === 0 && (
            <p className="mt-1 text-xs text-ink-400">No completed, un-billed jobs right now.</p>
          )}
        </div>

        {selectedJob && (
          <div className="rounded-md border border-ink-100 bg-ink-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Subtotal</span>
              <span className="font-semibold text-ink-800">{formatRs(totals.subtotal)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-ink-500">
                VAT
                <input
                  className="ml-2 w-16 rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs"
                  type="number"
                  aria-label="VAT percent"
                  value={Math.round(formik.values.taxRate * 100)}
                  onChange={(e) => formik.setFieldValue('taxRate', Number(e.target.value) / 100)}
                />
                <span className="ml-1 text-xs">%</span>
              </span>
              <span className="font-semibold text-ink-800">{formatRs(totals.tax)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-ink-200 pt-3">
              <span className="font-bold text-ink-900">Total</span>
              <span className="text-lg font-bold text-brand-600">{formatRs(totals.total)}</span>
            </div>

            {/* What the server would knock off. Advisory only — the amounts are
                recomputed when the invoice is raised, so a reward spent on
                another till in the meantime cannot be spent twice here. */}
            {quote && (quote.rewardsAvailable > 0 || quote.offerAmount > 0 || quote.redeemablePoints > 0) && (
              <div className="mt-3 space-y-2 border-t border-ink-200 pt-3">
                {quote.offerAmount > 0 && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={useOffer}
                      onChange={(e) => setUseOffer(e.target.checked)}
                    />
                    <span className="text-ink-600">
                      {quote.offerName} — <strong>−{formatRs(quote.offerAmount)}</strong>
                    </span>
                  </label>
                )}

                {quote.rewardsAvailable > 0 && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={useReward}
                      onChange={(e) => setUseReward(e.target.checked)}
                    />
                    <span className="text-ink-600">
                      Loyalty reward: {quote.rewardName} free —{' '}
                      <strong>−{formatRs(quote.rewardAmount)}</strong>
                      <span className="block text-xs text-ink-400">
                        {quote.rewardsAvailable} available. Theirs to save for a bigger bill, so it
                        is off unless asked for.
                      </span>
                    </span>
                  </label>
                )}

                {quote.redeemablePoints > 0 && (
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                    />
                    <span className="text-ink-600">
                      Spend {quote.redeemablePoints} points —{' '}
                      <strong>−{formatRs(quote.pointsAmount)}</strong>
                      <span className="block text-xs text-ink-400">
                        {quote.pointsBalance} on the account.
                      </span>
                    </span>
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input name="paid" label="Amount paid now" type="number" formik={formik} min={0} />
          <FormikDropdown name="method" label="Method" formik={formik} options={methodOptions} isClearable={false} />
        </div>

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  )
}
