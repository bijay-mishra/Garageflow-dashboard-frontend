import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Input from '@/components/common/form/Input'
import LogoPicker from '@/components/common/form/LogoPicker'
import { Spinner } from '@/components/common/loaders/States'
import { useCreateCompany, useUploadCompanyLogo, type ICompanyCreated } from './superadmin-query'
import CompanyHandover from './CompanyHandover'

const schema = Yup.object({
  companyCode: Yup.string()
    .trim()
    .required('A company code is required')
    .matches(/^[A-Za-z0-9-]+$/, 'Letters, numbers and hyphens only')
    .min(2, 'Too short')
    .max(40, 'Too long'),
  name: Yup.string().trim().required('A name is required').max(160),
  legalName: Yup.string().trim().max(200),
  address: Yup.string().trim().max(300),
  phone: Yup.string().trim().max(40),
  ownerName: Yup.string().trim().required("The owner's name is required").max(160),
  ownerEmail: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required("The owner's email is required"),
  // Optional, and blank is the recommended answer — the server generates one.
  // A password invented for somebody else tends to be the same password every
  // time, which across a dozen companies is a master key.
  ownerPassword: Yup.string().test(
    'length',
    'At least 8 characters, or leave blank',
    (value) => !value || value.length >= 8,
  ),
})

interface CompanyFormProps {
  modules: string[]
  onClose: () => void
}

/**
 * Creates a company and its first owner, in one step.
 *
 * Both together on purpose: a company nobody can sign into is not a company yet,
 * and creating them separately leaves a window where one exists without the
 * other and somebody has to remember to finish the job.
 */
export default function CompanyForm({ modules, onClose }: CompanyFormProps) {
  const createCompany = useCreateCompany()
  const uploadLogo = useUploadCompanyLogo()

  // Set once the company exists. Swaps the form for the credentials to read out.
  const [handover, setHandover] = useState<ICompanyCreated | null>(null)

  // Chosen before the company exists, so it cannot be uploaded yet — it goes up
  // in the same breath as the create, once there is a company code to put it on.
  const [logo, setLogo] = useState<File | null>(null)

  const formik = useFormik({
    initialValues: {
      companyCode: '',
      name: '',
      legalName: '',
      address: '',
      phone: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      // The everyday set. The rest are things a workshop asks for, so they
      // start off rather than everything being on and someone having to notice
      // what to remove.
      enabledModules: ['services', 'billing', 'reports', 'serviceHistory', 'staff'] as string[],
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      try {
        const res = await createCompany.mutateAsync(values)
        const created = res?.data?.data

        if (!created) {
          onClose()
          return
        }

        // After the company, and swallowed on failure. A logo that would not
        // upload must not cost the operator the one-time password below, which
        // exists in this response and nowhere else — the company is created
        // either way, and its logo can be set again from its own page.
        if (logo) {
          try {
            const withLogo = await uploadLogo.mutateAsync({
              code: created.company.companyCode,
              file: logo,
            })

            const saved = withLogo?.data?.data
            if (saved) created.company = saved
          } catch {
            /* reported by the mutation's onError; the company still stands */
          }
        }

        // Not closed on success. The password is in this response and nowhere
        // else, ever — closing the form would lose the one thing the operator
        // came here to collect.
        setHandover(created)
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  const toggle = (name: string) => {
    const next = formik.values.enabledModules.includes(name)
      ? formik.values.enabledModules.filter((m) => m !== name)
      : [...formik.values.enabledModules, name]

    formik.setFieldValue('enabledModules', next)
  }

  // One flag for both requests: to the operator this is a single "create", and
  // the buttons must stay disabled while the logo is still going up.
  const busy = createCompany.isPending || uploadLogo.isPending

  if (handover) return <CompanyHandover created={handover} onClose={onClose} />

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={formik.handleSubmit}
        className="my-8 w-full max-w-2xl space-y-5 rounded-xl bg-white p-6 shadow-xl"
      >
        <div>
          <h2 className="text-base font-bold text-ink-900">New company</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Creates the workshop, its first owner and a main branch. The owner signs in with the
            company code below.
          </p>
        </div>

        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">The workshop</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="companyCode"
              label="Company code"
              formik={formik}
              isRequired
              placeholder="KOSHI"
            />
            <Input name="name" label="Trading name" formik={formik} isRequired placeholder="Koshi Auto Works" />
          </div>

          <Input
            name="legalName"
            label="Registered name"
            formik={formik}
            placeholder="Koshi Auto Works Pvt. Ltd."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="address" label="Address" formik={formik} placeholder="Main Road, Biratnagar" />
            <Input name="phone" label="Phone" formik={formik} placeholder="+977 21-555111" />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">
              Logo <span className="font-normal text-ink-400">— optional</span>
            </span>
            {/* Held, not posted. There is no company to attach a file to until
                the form below succeeds, so the File waits in state and goes up
                immediately afterwards. */}
            <LogoPicker
              url={null}
              name={formik.values.name || 'New company'}
              file={logo}
              onPick={setLogo}
              hint="Printed at the top of the invoices they issue. They can change it themselves later."
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-ink-100 pt-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">The owner</h3>
            <p className="mt-1 text-xs text-ink-400">
              Their first credentials. Give the password to them directly — it is not emailed, and
              this screen is the only place it appears.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="ownerName" label="Name" formik={formik} isRequired placeholder="Ram Thapa" />
            <Input
              name="ownerEmail"
              label="Email"
              type="email"
              formik={formik}
              isRequired
              placeholder="ram@koshi.com"
            />
          </div>

          <Input
            name="ownerPassword"
            label="One-time password"
            formik={formik}
            placeholder="Leave blank to generate a strong one"
          />

          <p className="text-[11px] text-ink-400">
            Shown once after this, to read out. The owner is made to replace it the first time they
            sign in, so it stops working — and you stop knowing their password.
          </p>
        </section>

        <section className="space-y-3 border-t border-ink-100 pt-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Modules</h3>
            <p className="mt-1 text-xs text-ink-400">
              What they can reach. Customers, vehicles and job cards are always on — they are the
              product, not an add-on.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {modules.map((name) => {
              const on = formik.values.enabledModules.includes(name)

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggle(name)}
                  className={
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition ' +
                    (on
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'bg-white text-ink-500 ring-1 ring-ink-200 hover:bg-ink-100')
                  }
                >
                  {name}
                </button>
              )
            })}
          </div>
        </section>

        <div className="flex justify-end gap-2 border-t border-ink-100 pt-5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy && <Spinner />} Create company
          </button>
        </div>
      </form>
    </div>
  )
}
