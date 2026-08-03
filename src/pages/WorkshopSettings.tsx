import { lazy, Suspense } from 'react'
import { useFormik, type FormikProps } from 'formik'
import * as Yup from 'yup'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import Input from '@/components/common/form/Input'
import Toggle from '@/components/common/form/Toggle'
import Badge from '@/components/common/Badge'
import { formatRs } from '@/lib/format'
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
  about: Yup.string().trim().max(600, 'Keep it under 600 characters').default(''),
  isListed: Yup.boolean().default(false),
  deliveryEnabled: Yup.boolean().default(false),
  // Money and distance both have to be non-negative — a negative per-km rate
  // would pay the customer to live further away.
  deliveryBaseFee: Yup.number().min(0, 'Cannot be negative').default(50),
  deliveryPerKm: Yup.number().min(0, 'Cannot be negative').default(15),
  deliveryFreeAbove: Yup.number().min(0, 'Cannot be negative').default(5000),
  deliveryMaxKm: Yup.number().min(0, 'Cannot be negative').max(500, 'That is too far').default(15),
  bankName: Yup.string().trim().max(120, 'Name is too long').default(''),
  bankAccountName: Yup.string().trim().max(160, 'Name is too long').default(''),
  bankAccountNumber: Yup.string().trim().max(60, 'That is too long').default(''),
  bankBranch: Yup.string().trim().max(120, 'That is too long').default(''),
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
      about: workshop?.about ?? '',
      isListed: workshop?.isListed ?? false,
      deliveryEnabled: workshop?.deliveryEnabled ?? false,
      deliveryBaseFee: workshop?.deliveryBaseFee ?? 50,
      deliveryPerKm: workshop?.deliveryPerKm ?? 15,
      deliveryFreeAbove: workshop?.deliveryFreeAbove ?? 5000,
      deliveryMaxKm: workshop?.deliveryMaxKm ?? 15,
      bankName: workshop?.bankName ?? '',
      bankAccountName: workshop?.bankAccountName ?? '',
      bankAccountNumber: workshop?.bankAccountNumber ?? '',
      bankBranch: workshop?.bankBranch ?? '',
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

          <Listing formik={formik} />
        </div>

        <Delivery formik={formik} hasPin={pin != null} canDeliver={workshop?.canDeliver ?? false} />

        <BankTransfer formik={formik} />

        <OnlinePayment providers={workshop?.onlineProviders ?? []} />

        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </div>
  )
}

/**
 * Whether customers browsing the app can find this garage.
 *
 * Off by default, and that is a deliberate choice rather than an oversight. A
 * workshop that bought this to run its own books has not agreed to be listed in
 * a public directory, and putting its name, address and phone number in front of
 * strangers is not a decision the software gets to make for it.
 */
function Listing({ formik }: { formik: FormikProps<WorkshopFormType> }) {
  const listed = formik.values.isListed

  return (
    <section className="card space-y-4 p-5">
      <div>
        <h2 className="text-sm font-bold text-ink-900">In the customer app</h2>
        <p className="mt-0.5 text-xs text-ink-400">
          Customers who install GarageFlow browse a list of garages and join the ones they use.
          Nothing here affects the customers you already have.
        </p>
      </div>

      <Toggle
        checked={listed}
        onChange={(next) => formik.setFieldValue('isListed', next)}
        label="List this garage in the app"
        hint="Shows your name, address, phone and opening hours to anyone browsing."
      />

      <div>
        <label htmlFor="about" className="mb-1.5 block text-xs font-semibold text-ink-600">
          About
        </label>
        <textarea
          id="about"
          name="about"
          className="input min-h-[72px] resize-y"
          value={formik.values.about}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          maxLength={600}
          placeholder="Family-run since 1998. Diesel specialists, pickup and drop across the valley."
          disabled={!listed}
        />
        <p className="mt-1 text-xs text-ink-400">
          {listed
            ? 'A sentence or two on your card in the app. No pictures or reviews yet.'
            : 'Switch listing on to write your description.'}
        </p>
      </div>

      {listed && !formik.values.latitude && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Drop a pin on the map above, or your garage appears without a distance — which is the one
          thing customers sort by.
        </p>
      )}
    </section>
  )
}

/**
 * What home delivery costs.
 *
 * Distance-based, quoted from the workshop's pin to the customer's, so it cannot
 * be offered without both. `canDeliver` is the server's answer to "would a quote
 * actually work right now", and it is what gates the switch rather than the
 * switch's own value — a shop could otherwise turn delivery on, have no pin, and
 * wonder why no customer is ever offered it.
 */
function Delivery({
  formik,
  hasPin,
  canDeliver,
}: {
  formik: FormikProps<WorkshopFormType>
  hasPin: boolean
  canDeliver: boolean
}) {
  const on = formik.values.deliveryEnabled

  // The worked example. A fee formula is abstract until you see one number come
  // out of it, and this is the number a customer 6 km away would be charged.
  const example =
    formik.values.deliveryBaseFee + formik.values.deliveryPerKm * 6

  return (
    <section className="card space-y-4 p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink-900">Home delivery</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            When a job is done the customer chooses collection or delivery. The fee is fixed at that
            moment and added to their bill as a line — it is never recalculated afterwards.
          </p>
        </div>
        {on && canDeliver && <Badge tone="green">Quoting</Badge>}
        {on && !canDeliver && <Badge tone="amber">Needs a pin</Badge>}
      </div>

      <Toggle
        checked={on}
        onChange={(next) => formik.setFieldValue('deliveryEnabled', next)}
        label="Offer home delivery"
        hint="Customers see a price next to the button before they commit to it."
        disabled={!hasPin && !on}
        disabledReason="Set the workshop's location first — the fee is measured from it."
      />

      {on && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              name="deliveryBaseFee"
              label="Base fee (Rs)"
              type="number"
              min={0}
              step={5}
              formik={formik}
            />
            <Input
              name="deliveryPerKm"
              label="Per km (Rs)"
              type="number"
              min={0}
              step={1}
              formik={formik}
            />
            <Input
              name="deliveryFreeAbove"
              label="Free above (Rs)"
              type="number"
              min={0}
              step={100}
              formik={formik}
            />
            <Input
              name="deliveryMaxKm"
              label="Maximum distance (km)"
              type="number"
              min={0}
              step={1}
              formik={formik}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
            <p className="rounded-md bg-ink-50 px-3 py-2 text-ink-600">
              A customer <strong className="text-ink-900">6 km</strong> away pays{' '}
              <strong className="text-ink-900">{formatRs(example)}</strong>.
            </p>
            <p className="rounded-md bg-ink-50 px-3 py-2 text-ink-600">
              {formik.values.deliveryFreeAbove > 0 ? (
                <>
                  Free on bills over{' '}
                  <strong className="text-ink-900">{formatRs(formik.values.deliveryFreeAbove)}</strong>.
                </>
              ) : (
                'Always charged — no free threshold.'
              )}
            </p>
            <p className="rounded-md bg-ink-50 px-3 py-2 text-ink-600">
              Not offered beyond{' '}
              <strong className="text-ink-900">{formik.values.deliveryMaxKm} km</strong>.
            </p>
          </div>

          {/* The honest limit of a haversine distance. A shop setting a per-km
              rate should know it is being paid for the crow's flight, not the
              road, because in a valley those differ a lot. */}
          <p className="text-xs text-ink-400">
            Distance is measured in a straight line, not along the road, so a real drive is usually
            longer than the figure quoted. Set the per-km rate with that in mind.
          </p>
        </>
      )}
    </section>
  )
}


/**
 * Where a customer sends a bank transfer.
 *
 * Not a gateway and the screen says so. The app shows these details, the
 * customer moves the money in their own banking app, and a staff member
 * confirms it against the statement — which is the step that marks the bill
 * paid. No fees, no merchant account, no integration to keep working.
 *
 * Leave it blank and the app simply does not offer the option, rather than
 * showing an empty account number.
 */
function BankTransfer({ formik }: { formik: FormikProps<WorkshopFormType> }) {
  const ready =
    formik.values.bankName.trim().length > 0 &&
    formik.values.bankAccountNumber.trim().length > 0

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink-900">Bank transfer</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Customers see these details in the app and pay from their own banking app. Leave blank
            to hide the option.
          </p>
        </div>
        {ready ? <Badge tone="green">Shown in app</Badge> : <Badge tone="gray">Hidden</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input name="bankName" label="Bank" formik={formik} placeholder="Nabil Bank" />
        <Input name="bankBranch" label="Branch (optional)" formik={formik} placeholder="Kalanki" />
      </div>

      <Input
        name="bankAccountName"
        label="Account name"
        formik={formik}
        placeholder="Valley Auto Care Pvt. Ltd."
      />
      <Input
        name="bankAccountNumber"
        label="Account number"
        formik={formik}
        placeholder="0123456789012"
      />

      {/* The part staff need to know, stated once and plainly. */}
      <p className="rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-500">
        A customer tapping <strong className="text-ink-700">I have transferred it</strong> does not
        mark the bill paid — it flags the payment as pending for you to confirm against the
        statement. Pending transfers appear on the Billing screen.
      </p>
    </section>
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
