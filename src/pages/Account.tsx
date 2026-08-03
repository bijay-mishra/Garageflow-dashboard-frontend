import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import {
  UserCircleIcon,
  KeyIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  GlobeAltIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import Panel from '@/components/common/Panel'
import Avatar from '@/components/common/Avatar'
import { Field } from '@/components/common/form/Field'
import Input from '@/components/common/form/Input'
import { Spinner } from '@/components/common/loaders/States'
import {
  useChangePassword,
  useForgotPassword,
  useUpdateProfile,
} from '@/components/Auth/auth-query'
import {
  changePasswordInitialValues,
  changePasswordSchema,
  profileFormSchema,
  toProfileFormValues,
  type ChangePasswordFormType,
  type ProfileFormType,
} from '@/components/Auth/auth-schema'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useLang } from '@/context/LanguageContext'
import { LANGS } from '@/lib/i18n'
import { workshopInfo } from '@/data/seed'

type Tab = 'profile' | 'security' | 'preferences'

const TABS: { id: Tab; label: string; icon: typeof UserCircleIcon }[] = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'security', label: 'Security', icon: KeyIcon },
  { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
]

export default function Account() {
  const [params, setParams] = useSearchParams()
  const initial = (params.get('tab') as Tab) || 'profile'
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initial) ? initial : 'profile')

  const selectTab = (id: Tab) => {
    setTab(id)
    setParams(id === 'profile' ? {} : { tab: id }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <StickyHeader title="My Account" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Side tabs */}
        <nav className="flex gap-2 lg:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              className={`flex flex-1 items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition lg:flex-none ${
                tab === id ? 'bg-brand-600 text-white shadow-glow' : 'bg-white text-ink-600 hover:bg-ink-50 border border-ink-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div>
          {tab === 'profile' && <ProfileTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  const { user, setUser } = useAuth()
  const updateProfile = useUpdateProfile()

  const formik = useFormik<ProfileFormType>({
    initialValues: toProfileFormValues(user),
    validationSchema: profileFormSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const res = await updateProfile.mutateAsync(values)
        // The server echoes the saved user back, so the topbar and sidebar
        // update from what was actually persisted rather than what was typed.
        const saved = res?.data?.data
        if (saved) setUser(saved)
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  return (
    <Panel title="Profile" subtitle="Your personal and workshop details">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={formik.values.name || 'User'} size="lg" />
        <div>
          <p className="text-lg font-bold text-ink-900">{formik.values.name || '—'}</p>
          <p className="text-sm text-ink-400">
            {user?.role} · {user?.workshop || workshopInfo.name}
          </p>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input name="name" label="Full name" formik={formik} isRequired />
          <Input name="phone" label="Phone" type="tel" formik={formik} placeholder="+977 98…" />
        </div>

        <Input name="email" label="Email" type="email" formik={formik} isRequired />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Role">
            <input className="input bg-ink-50" value={user?.role ?? ''} disabled />
          </Field>
          <Field label="Workshop">
            <input className="input bg-ink-50" value={user?.workshop || workshopInfo.name} disabled />
          </Field>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="btn-primary" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Spinner /> : <CheckIcon className="h-4 w-4" />} Save changes
          </button>
        </div>
      </form>
    </Panel>
  )
}

function SecurityTab() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const changePassword = useChangePassword()
  const forgotPassword = useForgotPassword()

  const formik = useFormik<ChangePasswordFormType>({
    initialValues: changePasswordInitialValues,
    validationSchema: changePasswordSchema,
    onSubmit: async (values) => {
      try {
        await changePassword.mutateAsync(values)
        // The API revokes every refresh token on a password change, so this
        // session is already dead — send them back to sign in with the new one.
        signOut()
        navigate('/login', { replace: true })
      } catch {
        /* handled by the mutation's onError */
      }
    },
  })

  return (
    <div className="space-y-6">
      <Panel title="Change password" subtitle="Use at least 8 characters">
        <form onSubmit={formik.handleSubmit} className="max-w-md space-y-4">
          <Input
            name="currentPassword"
            label="Current password"
            type="password"
            formik={formik}
            isRequired
          />
          <Input name="newPassword" label="New password" type="password" formik={formik} isRequired />
          <Input
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            formik={formik}
            isRequired
          />

          <p className="text-xs text-ink-400">
            Changing your password signs you out everywhere, including here.
          </p>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={changePassword.isPending}>
              {changePassword.isPending ? <Spinner /> : <KeyIcon className="h-4 w-4" />} Update password
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Forgot your password?" subtitle="Email a code to yourself instead">
        <p className="text-sm text-ink-500">
          The form above needs your current password. If you don't remember it, we can email a
          six-digit code to <span className="font-semibold text-ink-700">{user?.email}</span> and
          take you to the reset screen.
        </p>

        <button
          className="btn-ghost mt-4"
          disabled={forgotPassword.isPending || !user}
          onClick={async () => {
            if (!user) return

            // Sent from here so the reset screen opens on the code step with one
            // already in flight — that screen never sends a code of its own.
            await forgotPassword
              .mutateAsync({ companyCode: user.companyCode, email: user.email })
              .catch(() => undefined)

            navigate(
              `/reset-password?company=${encodeURIComponent(user.companyCode)}` +
                `&email=${encodeURIComponent(user.email)}`,
            )
          }}
        >
          {forgotPassword.isPending && <Spinner />} Email me a code
        </button>
      </Panel>
    </div>
  )
}

function PreferencesTab() {
  const { theme, toggle } = useTheme()
  const { lang, setLang } = useLang()

  return (
    <Panel title="Preferences" subtitle="Personalise your dashboard">
      <div className="space-y-6">
        {/* Theme */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-800">Appearance</p>
            <p className="text-xs text-ink-400">Switch between light and dark.</p>
          </div>
          <div className="flex items-center rounded-md border border-ink-200 bg-white p-0.5">
            <button
              onClick={() => theme === 'dark' && toggle()}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${theme === 'light' ? 'bg-brand-600 text-white' : 'text-ink-500'}`}
            >
              <SunIcon className="h-4 w-4" /> Light
            </button>
            <button
              onClick={() => theme === 'light' && toggle()}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${theme === 'dark' ? 'bg-brand-600 text-white' : 'text-ink-500'}`}
            >
              <MoonIcon className="h-4 w-4" /> Dark
            </button>
          </div>
        </div>

        <div className="border-t border-ink-100" />

        {/* Language */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-800">Language</p>
            <p className="text-xs text-ink-400">भाषा — English or Nepali.</p>
          </div>
          <div className="flex items-center rounded-md border border-ink-200 bg-white p-0.5">
            <GlobeAltIcon className="mx-1 h-4 w-4 text-ink-400" />
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${lang === l.code ? 'bg-brand-600 text-white' : 'text-ink-500'}`}
              >
                {l.long}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}
