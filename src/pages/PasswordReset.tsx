import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import PasswordToggle from '@/components/common/form/PasswordToggle'
import {
  useForgotPassword,
  useResetPassword,
  useVerifyResetCode,
} from '@/components/Auth/auth-query'
import {
  MIN_PASSWORD_LENGTH,
  forgotPasswordInitialValues,
  forgotPasswordSchema,
  resetCodeSchema,
  resetPasswordInitialValues,
  resetPasswordSchema,
  type ForgotPasswordFormType,
  type ResetCodeFormType,
  type ResetPasswordFormType,
} from '@/components/Auth/auth-schema'
import { workshopInfo } from '@/data/seed'

/**
 * Forgotten password, in three steps: who you are, the code we emailed, the new
 * password.
 *
 * A code rather than a reset link. The link version could only ever be finished
 * in a browser, which left the phone app with a button that sent an email it
 * could not act on — see the note on `AuthController.ForgotPassword` for why
 * making that work needs infrastructure that does not exist yet. Six digits are
 * the same three steps on both clients.
 *
 * Serves `/forgot-password` and `/reset-password`. The second is where the
 * email's button lands, carrying `?company=&email=` so the account is already
 * filled in and the screen opens on the code step — the code itself is never in
 * that URL.
 */
export default function PasswordReset() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const linkedEmail = params.get('email') ?? ''
  const linkedCompany = params.get('company') ?? ''

  const forgotPassword = useForgotPassword()
  const verifyCode = useVerifyResetCode()
  const resetPassword = useResetPassword()

  // Arriving from the email means a code was sent moments ago, so that step is
  // where the useful work is — asking for the address again would be asking a
  // question the link already answered.
  const [step, setStep] = useState<'account' | 'code' | 'password' | 'done'>(
    linkedEmail ? 'code' : 'account',
  )

  const [account, setAccount] = useState({
    companyCode: linkedCompany,
    email: linkedEmail,
  })

  /** Where the code went, as the server described it. Their own address when they came from the link. */
  const [sentTo, setSentTo] = useState(linkedEmail)
  const [expiresInMinutes, setExpiresInMinutes] = useState(15)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // Seconds until another code may be asked for. The server throttles too — this
  // is so the button says why it is doing nothing rather than silently sending
  // the same reassuring message.
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  /** Asks for a code. Shared by step one and the resend button. */
  const sendCode = async (values: ForgotPasswordFormType) => {
    setError('')

    const res = await forgotPassword.mutateAsync(values)
    const started = res?.data?.data

    setAccount(values)
    setSentTo(started?.sentTo ?? values.email)
    setExpiresInMinutes(started?.expiresInMinutes ?? 15)
    setCooldown(60)
    setStep('code')
  }

  const accountForm = useFormik<ForgotPasswordFormType>({
    initialValues: linkedEmail
      ? { companyCode: linkedCompany, email: linkedEmail }
      : forgotPasswordInitialValues,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values) => {
      try {
        await sendCode(values)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not send a code just now.')
      }
    },
  })

  const codeForm = useFormik<ResetCodeFormType>({
    initialValues: { code: '' },
    validationSchema: resetCodeSchema,
    onSubmit: async (values) => {
      setError('')

      try {
        await verifyCode.mutateAsync({ ...account, code: values.code })

        // Held for the last step. Verifying does not spend it.
        setCode(values.code)
        setStep('password')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'That code was not accepted.')
      }
    },
  })

  const passwordForm = useFormik<ResetPasswordFormType>({
    initialValues: resetPasswordInitialValues,
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      setError('')

      try {
        await resetPassword.mutateAsync({ ...account, code, newPassword: values.newPassword })
        setStep('done')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reset your password.')

        // The code is spent or burnt on most failures here, and letting them
        // retype a password against a dead code is a loop with no exit.
        setStep('code')
        codeForm.setFieldValue('code', '')
      }
    },
  })

  const resend = async () => {
    if (cooldown > 0) return

    try {
      await sendCode(account)
      codeForm.setFieldValue('code', '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send another code.')
    }
  }

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

        {step !== 'done' && <Steps current={step} />}

        {step === 'account' && (
          <>
            <h2 className="mt-5 text-2xl font-bold text-ink-900">Forgot password?</h2>
            <p className="mt-1 text-sm text-ink-500">
              Tell us the account, and we'll email a six-digit code.
            </p>

            <form onSubmit={accountForm.handleSubmit} className="mt-6 space-y-4">
              <Field
                name="companyCode"
                label="Company code"
                icon={<BuildingOffice2Icon className="h-4 w-4" />}
                className="uppercase tracking-wider"
                value={accountForm.values.companyCode}
                onChange={(e) =>
                  accountForm.setFieldValue('companyCode', e.target.value.toUpperCase())
                }
                onBlur={accountForm.handleBlur}
                error={accountForm.submitCount > 0 ? accountForm.errors.companyCode : undefined}
                placeholder="DEMO"
              />

              <Field
                name="email"
                label="Email"
                type="email"
                icon={<EnvelopeIcon className="h-4 w-4" />}
                value={accountForm.values.email}
                onChange={accountForm.handleChange}
                onBlur={accountForm.handleBlur}
                error={accountForm.submitCount > 0 ? accountForm.errors.email : undefined}
                placeholder="you@workshop.com"
              />

              {error && <Problem>{error}</Problem>}

              <button type="submit" className="btn-primary w-full" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending && <Spinner />} Send code
              </button>
            </form>

            <BackToSignIn />
          </>
        )}

        {step === 'code' && (
          <>
            <h2 className="mt-5 text-2xl font-bold text-ink-900">Enter the code</h2>
            <p className="mt-1 text-sm text-ink-500">
              We sent a six-digit code to <span className="font-semibold text-ink-700">{sentTo}</span>
              . It expires in {expiresInMinutes} minutes.
            </p>

            <form onSubmit={codeForm.handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-600">Code</span>
                <input
                  name="code"
                  className="input text-center text-2xl font-bold tracking-[0.5em]"
                  // Numeric keypad on a phone, and a paste of "123456" still works.
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={codeForm.values.code}
                  onChange={(e) =>
                    codeForm.setFieldValue('code', e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  onBlur={codeForm.handleBlur}
                />
                {codeForm.submitCount > 0 && codeForm.errors.code && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{codeForm.errors.code}</p>
                )}
              </label>

              {error && <Problem>{error}</Problem>}

              <button type="submit" className="btn-primary w-full" disabled={verifyCode.isPending}>
                {verifyCode.isPending && <Spinner />} Continue
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || forgotPassword.isPending}
                className="font-semibold text-brand-600 transition hover:text-brand-700 disabled:text-ink-400"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send a new code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep('account')
                }}
                className="font-medium text-ink-500 transition hover:text-ink-800"
              >
                Wrong address?
              </button>
            </div>

            <p className="mt-4 text-xs text-ink-400">
              Nothing arrived? Check your spam folder — or ask your workshop, who can reset it for
              you.
            </p>

            <BackToSignIn />
          </>
        )}

        {step === 'password' && (
          <>
            <h2 className="mt-5 text-2xl font-bold text-ink-900">Choose a new password</h2>
            <p className="mt-1 text-sm text-ink-500">
              You'll need to sign in again on your other devices.
            </p>

            <form onSubmit={passwordForm.handleSubmit} className="mt-6 space-y-4">
              <Field
                name="newPassword"
                label="New password"
                type="password"
                icon={<LockClosedIcon className="h-4 w-4" />}
                autoComplete="new-password"
                value={passwordForm.values.newPassword}
                onChange={passwordForm.handleChange}
                onBlur={passwordForm.handleBlur}
                error={passwordForm.submitCount > 0 ? passwordForm.errors.newPassword : undefined}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              />

              <Field
                name="confirmPassword"
                label="Confirm new password"
                type="password"
                icon={<LockClosedIcon className="h-4 w-4" />}
                autoComplete="new-password"
                value={passwordForm.values.confirmPassword}
                onChange={passwordForm.handleChange}
                onBlur={passwordForm.handleBlur}
                error={
                  passwordForm.submitCount > 0 ? passwordForm.errors.confirmPassword : undefined
                }
                placeholder="Type it again"
              />

              {error && <Problem>{error}</Problem>}

              <button type="submit" className="btn-primary w-full" disabled={resetPassword.isPending}>
                {resetPassword.isPending && <Spinner />} Reset password
              </button>
            </form>

            <BackToSignIn />
          </>
        )}

        {step === 'done' && (
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircleIcon className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-ink-900">Password updated</h2>
            <p className="mt-1 text-sm text-ink-500">
              {resetPassword.data?.data?.message ?? 'You can now sign in with your new password.'}
            </p>
            <button className="btn-primary mt-6 w-full" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/** Where you are in the three steps. */
function Steps({ current }: { current: 'account' | 'code' | 'password' }) {
  const order = ['account', 'code', 'password'] as const
  const at = order.indexOf(current)

  return (
    <div className="flex items-center gap-2">
      {order.map((name, i) => (
        <span
          key={name}
          className={
            'h-1 flex-1 rounded-full transition ' + (i <= at ? 'bg-brand-600' : 'bg-ink-200')
          }
        />
      ))}
    </div>
  )
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
      {children}
    </p>
  )
}

function BackToSignIn() {
  return (
    <Link
      to="/login"
      className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800"
    >
      <ArrowLeftIcon className="h-4 w-4" /> Back to sign in
    </Link>
  )
}

interface FieldProps {
  name: string
  label: string
  icon: React.ReactNode
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  type?: string
  placeholder?: string
  className?: string
  autoComplete?: string
}

function Field({
  name,
  label,
  icon,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  className = '',
  autoComplete,
}: FieldProps) {
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-600">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
          {icon}
        </span>
        <input
          name={name}
          type={isPassword && shown ? 'text' : type}
          className={`input pl-10 ${isPassword ? 'pr-11' : ''} ${className}`}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
        />
        {isPassword && <PasswordToggle shown={shown} onToggle={() => setShown((s) => !s)} />}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </label>
  )
}
