import { Link } from 'react-router-dom'
import { useFormik } from 'formik'
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  EnvelopeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import { useForgotPassword } from '@/components/Auth/auth-query'
import { forgotPasswordInitialValues, forgotPasswordSchema, type ForgotPasswordFormType } from '@/components/Auth/auth-schema'
import { workshopInfo } from '@/data/seed'

export default function ForgotPassword() {
  const forgotPassword = useForgotPassword()

  const formik = useFormik<ForgotPasswordFormType>({
    initialValues: forgotPasswordInitialValues,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values) => {
      // Deliberately ignores failure: the API answers identically whether or
      // not the account exists, so there is nothing useful to branch on.
      await forgotPassword.mutateAsync(values).catch(() => undefined)
    },
  })

  const sent = forgotPassword.isSuccess
  const serverMessage = forgotPassword.data?.data?.message

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 shadow-glow">
            <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-ink-900">{workshopInfo.name}</p>
            <p className="text-xs text-ink-400">{workshopInfo.tagline}</p>
          </div>
        </div>

        {sent ? (
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircleIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink-900">Check your email</h2>
            <p className="mt-1 text-sm text-ink-500">{serverMessage}</p>
            <p className="mt-3 text-xs text-ink-400">
              The link is valid for 30 minutes and can be used once.
            </p>
            <Link to="/login" className="btn-primary mt-6 w-full">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-ink-900">Forgot password?</h2>
            <p className="mt-1 text-sm text-ink-500">
              Enter your company code and email and we'll send you a reset link.
            </p>

            <form onSubmit={formik.handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Company code</span>
                <div className="relative">
                  <BuildingOffice2Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    name="companyCode"
                    className="input pl-10 uppercase tracking-wider"
                    value={formik.values.companyCode}
                    onChange={(e) => formik.setFieldValue('companyCode', e.target.value.toUpperCase())}
                    onBlur={formik.handleBlur}
                    placeholder="DEMO"
                  />
                </div>
                {formik.errors.companyCode && formik.submitCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{formik.errors.companyCode}</p>
                )}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Email</span>
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    name="email"
                    className="input pl-10"
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="bijaymishra276@gmail.com"
                  />
                </div>
                {formik.errors.email && formik.submitCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{formik.errors.email}</p>
                )}
              </label>

              <button type="submit" className="btn-primary w-full" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending && <Spinner />} Send reset link
              </button>
            </form>

            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
