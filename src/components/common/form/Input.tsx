import { useState } from 'react'
import clsx from 'clsx'
import type { FormikProps } from 'formik'
import PasswordToggle from './PasswordToggle'

type InputType = 'text' | 'number' | 'date' | 'email' | 'password' | 'tel' | 'time'

interface InputProps {
  /** Field name — used to read value, error and touched state off `formik`. */
  name: string
  label?: string
  type?: InputType
  formik: FormikProps<any>
  placeholder?: string
  isRequired?: boolean
  /** Read-only display of the current value. */
  isView?: boolean
  disabled?: boolean
  min?: number | string
  max?: number | string
  step?: number | string
  className?: string
  /** Overrides the value read from `formik` — rarely needed. */
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Formik-bound text/number/date input. Reads its value, error and touched state
 * straight off the `formik` instance, so a form only has to name the field.
 *
 * Errors surface once the field has been touched or a submit has been
 * attempted — typing into an empty required field should not scold you before
 * you have finished.
 */
export default function Input({
  name,
  label,
  type = 'text',
  formik,
  placeholder,
  isRequired = false,
  isView = false,
  disabled = false,
  min,
  max,
  step,
  className,
  value,
  onChange,
}: InputProps) {
  const fieldValue = value ?? (formik.values[name] as string | number | undefined) ?? ''
  const error = formik.errors[name] as string | undefined
  const showError = Boolean(error) && (Boolean(formik.touched[name]) || formik.submitCount > 0)

  // Every password field in the app gets the eye for free, which is the point
  // of putting it here: the alternative was each form remembering to ask.
  // Held per field rather than per form — revealing the new password while
  // confirming it against a hidden one is exactly the check being made.
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'

  if (isView) {
    return (
      <div className={className}>
        {label && <span className="mb-1.5 block text-xs font-semibold text-ink-600">{label}</span>}
        <p className="text-sm text-ink-900">{fieldValue === '' ? '—' : fieldValue}</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-600">
          {label}
          {isRequired && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && shown ? 'text' : type}
          value={fieldValue}
          onChange={onChange ?? formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={clsx(
            'input',
            // Room for the eye, so a long password stops before it rather than
            // scrolling underneath.
            isPassword && 'pr-11',
            showError && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          )}
        />

        {isPassword && <PasswordToggle shown={shown} onToggle={() => setShown((s) => !s)} />}
      </div>

      {showError && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}
