import { lazy, Suspense } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import Input from '@/components/common/form/Input'
import { ErrorBlock, LoadingBlock, Spinner } from '@/components/common/loaders/States'
import {
  useGetWorkshop,
  useUpdateWorkshop,
  type WorkshopFormType,
} from '@/components/Workshop/workshop-query'

const LocationPicker = lazy(() => import('@/components/common/map/LocationPicker'))

const schema = Yup.object({
  name: Yup.string().trim().max(160, 'Name is too long').default(''),
  legalName: Yup.string().trim().max(200, 'Name is too long').default(''),
  address: Yup.string().trim().max(300, 'Address is too long').default(''),
  phone: Yup.string().trim().max(40, 'Phone is too long').default(''),
  email: Yup.string().trim().email('Enter a valid email address').max(160).default(''),
  taxNumber: Yup.string().trim().max(40, 'PAN is too long').default(''),
  openingHours: Yup.string().trim().max(200, 'That is too long').default(''),
  invoiceFooter: Yup.string().trim().max(500, 'Footer is too long').default(''),
  latitude: Yup.number().nullable().default(null),
  longitude: Yup.number().nullable().default(null),
})

/**
 * The workshop's own details.
 *
 * Everything here appears somewhere a customer can see it: the legal name and
 * PAN on every printed invoice, the address and pin in the customer app with
 * directions. That is why it is a settings screen and not a config file — the
 * shop owns these, not the developer.
 */
export default function WorkshopSettings() {
  const { data: workshop, isLoading, isError } = useGetWorkshop()
  const updateWorkshop = useUpdateWorkshop()

  const formik = useFormik<WorkshopFormType>({
    initialValues: {
      name: workshop?.name ?? '',
      legalName: workshop?.legalName ?? '',
      address: workshop?.address ?? '',
      phone: workshop?.phone ?? '',
      email: workshop?.email ?? '',
      taxNumber: workshop?.taxNumber ?? '',
      openingHours: workshop?.openingHours ?? '',
      invoiceFooter: workshop?.invoiceFooter ?? '',
      latitude: workshop?.latitude ?? null,
      longitude: workshop?.longitude ?? null,
    },
    validationSchema: schema,
    // The record arrives after first render, so the form has to take it when it does.
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        // A partial update reads a missing coordinate as "leave it alone", so
        // removing the pin has to be said out loud.
        const clearLocation = workshop?.latitude != null && values.latitude == null
        await updateWorkshop.mutateAsync({ ...values, clearLocation })
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const pin =
    formik.values.latitude != null && formik.values.longitude != null
      ? { lat: formik.values.latitude, lng: formik.values.longitude }
      : null

  if (isLoading) return <LoadingBlock label="Loading workshop…" />
  if (isError) return <ErrorBlock />

  return (
    <div className="space-y-6">
      <StickyHeader title="Workshop">
        <button
          className="btn-primary"
          onClick={() => formik.handleSubmit()}
          disabled={updateWorkshop.isPending}
          type="button"
        >
          {updateWorkshop.isPending && <Spinner />} Save changes
        </button>
      </StickyHeader>

      <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card space-y-4 p-5">
          <div>
            <h2 className="text-sm font-bold text-ink-900">Identity</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              The legal name and PAN are printed on every invoice. They must match your
              registration, not your signage.
            </p>
          </div>

          <Input name="name" label="Trading name" formik={formik} placeholder="GarageFlow" />
          <Input
            name="legalName"
            label="Registered name"
            formik={formik}
            placeholder="Valley Auto Care Pvt. Ltd."
          />
          <Input name="taxNumber" label="PAN" formik={formik} placeholder="601234567" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="phone" label="Phone" type="tel" formik={formik} placeholder="+977 1-5234567" />
            <Input name="email" label="Email" type="email" formik={formik} placeholder="hello@yourshop.com" />
          </div>

          <Input
            name="openingHours"
            label="Opening hours"
            formik={formik}
            placeholder="Sun–Fri 9:00–18:00 · Sat closed"
          />

          <div>
            <label htmlFor="invoiceFooter" className="mb-1.5 block text-xs font-semibold text-ink-600">
              Invoice footer
            </label>
            <textarea
              id="invoiceFooter"
              name="invoiceFooter"
              className="input min-h-[64px] resize-y"
              value={formik.values.invoiceFooter}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Payment terms, warranty note, a thank-you…"
            />
            <p className="mt-1 text-xs text-ink-400">Printed under the totals on every bill.</p>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card space-y-3 p-5">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Where you are</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                Customers see this in the app with a Directions button. Type the address and the map
                will find it.
              </p>
            </div>

            <Input name="address" label="Address" formik={formik} placeholder="Ring Road, Kalanki, Kathmandu" />

            <Suspense
              fallback={
                <div className="flex h-[280px] items-center justify-center rounded-lg border border-ink-200">
                  <Spinner />
                </div>
              }
            >
              <LocationPicker
                value={pin}
                address={formik.values.address}
                onChange={(next) => {
                  formik.setFieldValue('latitude', next?.lat ?? null)
                  formik.setFieldValue('longitude', next?.lng ?? null)
                }}
              />
            </Suspense>
          </section>

          <OnlinePayment providers={workshop?.onlineProviders ?? []} />
        </div>

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </div>
  )
}

/**
 * Which wallets can actually take money right now.
 *
 * Read-only, because it is not a preference — it reflects whether the server has
 * usable credentials, and a toggle here would let someone switch on a button
 * that dead-ends for their customers.
 */
function OnlinePayment({ providers }: { providers: string[] }) {
  const all = ['eSewa', 'Khalti']

  return (
    <section className="card space-y-3 p-5">
      <div>
        <h2 className="text-sm font-bold text-ink-900">Online payment</h2>
        <p className="mt-0.5 text-xs text-ink-400">
          Customers pay from the app. Configured on the server, not here — see the{' '}
          <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">Payments</code> section of{' '}
          <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">appsettings.json</code>.
        </p>
      </div>

      <ul className="space-y-2">
        {all.map((provider) => {
          const live = providers.includes(provider)

          return (
            <li
              key={provider}
              className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2.5"
            >
              {/* h-5, not h-4.5 — Tailwind's default spacing scale has no 4.5,
                  so that class was dropped at build time and the icon rendered
                  at its natural SVG size, blowing the row apart. */}
              {live ? (
                <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-ink-300" />
              )}
              <span className="text-sm font-semibold text-ink-800">{provider}</span>
              <span className="ml-auto text-xs text-ink-400">
                {live ? 'Ready — sandbox keys' : 'No merchant key set'}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-ink-400">
        Cash and bank transfer are always available — staff record those at the counter.
      </p>
    </section>
  )
}
