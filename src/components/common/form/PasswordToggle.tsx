import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useLang } from '@/context/LanguageContext'

interface PasswordToggleProps {
  /** True while the password is readable. */
  shown: boolean
  onToggle: () => void
}

/**
 * The eye that reveals a password field.
 *
 * One definition rather than one per form: the sign-in page grew its own years
 * before the others had any, and a second hand-rolled copy is how two eyes end
 * up on opposite sides of the box.
 *
 * Positioned absolutely, so whatever holds the input needs `relative` and the
 * input itself needs padding on the right — otherwise a long password runs
 * underneath the icon rather than stopping short of it.
 *
 * `type="button"` is not decoration. A bare `<button>` inside a `<form>`
 * defaults to submit, so tapping the eye would post a half-typed login.
 */
export default function PasswordToggle({ shown, onToggle }: PasswordToggleProps) {
  const { t } = useLang()

  // Describes what the button *does*, not what the field is currently showing —
  // a screen reader announcing "password visible" as a button name reads like a
  // status rather than something to press.
  const label = shown ? t('login.hidePassword') : t('login.showPassword')

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={shown}
      title={label}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 transition hover:text-ink-700"
    >
      {shown ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
    </button>
  )
}
