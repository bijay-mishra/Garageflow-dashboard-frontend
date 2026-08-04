import { useFormik } from 'formik'
import * as Yup from 'yup'
import Input from '@/components/common/form/Input'
import LogoPicker from '@/components/common/form/LogoPicker'
import { Spinner } from '@/components/common/loaders/States'
import {
  useDeleteCompanyLogo,
  useUpdateCompany,
  useUploadCompanyLogo,
  type ICompany,
} from './superadmin-query'

const schema = Yup.object({
  name: Yup.string().trim().required('A name is required').max(160),
  legalName: Yup.string().trim().max(200),
  address: Yup.string().trim().max(300),
  phone: Yup.string().trim().max(40),
  email: Yup.string().trim().email('Enter a valid email address').max(160),
})

/**
 * Corrects a company's details.
 *
 * Only the descriptive fields. Modules and suspension have their own controls
 * on the page behind this one, because they change what the company *can do*
 * rather than what it is called — putting them in the same form as a phone
 * number invites saving one while meaning to change the other.
 *
 * The company code is shown and not editable. It is what their staff type at
 * sign-in; changing it would lock out everyone at the workshop at once, with no
 * warning to any of them.
 */
export default function CompanyEditForm({
  company,
  onClose,
}: {
  company: ICompany
  onClose: () => void
}) {
  const updateCompany = useUpdateCompany()
  const uploadLogo = useUploadCompanyLogo()
  const deleteLogo = useDeleteCompanyLogo()

  const formik = useFormik({
    initialValues: {
      name: company.name,
      legalName: company.legalName ?? '',
      address: company.address ?? '',
      phone: company.phone ?? '',
      email: company.email ?? '',
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      try {
        await updateCompany.mutateAsync({ code: company.companyCode, ...values })
        onClose()
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={formik.handleSubmit}
        className="my-8 w-full max-w-xl space-y-5 rounded-xl bg-white p-6 shadow-xl"
      >
        <div>
          <h2 className="text-base font-bold text-ink-900">Edit {company.name}</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Company code{' '}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-600">
              {company.companyCode}
            </code>{' '}
            — fixed, because their staff sign in with it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="name" label="Trading name" formik={formik} isRequired />
          <Input name="legalName" label="Registered name" formik={formik} />
        </div>

        <Input name="address" label="Address" formik={formik} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="phone" label="Phone" formik={formik} />
          <Input name="email" label="Email" type="email" formik={formik} />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-600">Logo</span>
          {/* Saved on pick rather than on Save changes, and the text below says
              so. Uploading a file and editing text are different requests, and
              pretending otherwise means one failing takes the other with it. */}
          <LogoPicker
            url={company.logoUrl}
            name={formik.values.name || company.name}
            onPick={(file) => uploadLogo.mutate({ code: company.companyCode, file })}
            onRemove={() => deleteLogo.mutate({ code: company.companyCode })}
            busy={uploadLogo.isPending || deleteLogo.isPending}
            hint="Saved straight away, separately from the fields above. Under 1 MB."
          />
        </div>

        <p className="text-xs text-ink-400">
          These appear on the workshop's invoices and in the customer app's garage directory.
        </p>

        <div className="flex justify-end gap-2 border-t border-ink-100 pt-5">
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={updateCompany.isPending}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={updateCompany.isPending}>
            {updateCompany.isPending && <Spinner />} Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
