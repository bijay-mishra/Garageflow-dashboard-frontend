import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { FormikProps } from 'formik'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useLang } from '@/context/LanguageContext'
import {
  bsDaysInMonth,
  bsMonthNames,
  bsToIso,
  otherCalendar,
  toBs,
} from '@/lib/nepaliDate'

interface DateInputProps {
  name: string
  label?: string
  formik: FormikProps<any>
  isRequired?: boolean
  disabled?: boolean
  min?: string
  max?: string
  className?: string
  /** Shown under the field. The converted date is appended to it. */
  helperText?: string
}

/**
 * A date field that follows the interface language.
 *
 * In English it is the browser's native date picker — nothing beats it for
 * keyboard entry, and it is already localised, accessible and familiar.
 *
 * In Nepali it becomes three selects: year, month, day. Not a rendered BS
 * calendar grid, and that is a deliberate limit rather than a shortcut. A
 * correct BS calendar has to know which weekday each month starts on and how
 * many days it has — 29 to 32, varying by year — and a grid that gets either
 * wrong is worse than no grid, because it looks authoritative. Three selects
 * driven by the conversion table cannot produce a date that does not exist.
 *
 * Either way the value stored on the form is an ISO Gregorian day string, so
 * nothing downstream — validation, the API, the database — has any idea this
 * component exists.
 */
export default function DateInput({
  name,
  label,
  formik,
  isRequired = false,
  disabled = false,
  min,
  max,
  className,
  helperText,
}: DateInputProps) {
  const { lang } = useLang()

  const value = (formik.values[name] as string | undefined) ?? ''
  const error = formik.errors[name] as string | undefined
  const showError = Boolean(error) && (Boolean(formik.touched[name]) || formik.submitCount > 0)

  const bs = useMemo(() => toBs(value), [value])

  // Which BS date the three selects are showing. Kept locally so a half-made
  // selection — year changed, day not yet — does not write an invalid date to
  // the form or blank the field mid-edit.
  const [draft, setDraft] = useState(() => bs ?? null)

  useEffect(() => {
    setDraft(toBs(value))
  }, [value])

  const commit = (next: { year: number; month: number; day: number }) => {
    // Clamp the day rather than refusing: switching from a 32-day month to a
    // 30-day one with the 31st selected is an ordinary thing to do, and losing
    // the whole date over it would be hostile.
    const maxDay = bsDaysInMonth(next.year, next.month)
    const day = Math.min(next.day, maxDay)

    const iso = bsToIso(next.year, next.month, day)

    setDraft({ ...next, day, monthName: bsMonthNames('en')[next.month - 1] })

    if (iso) {
      formik.setFieldValue(name, iso)
      formik.setFieldTouched(name, true, false)
    }
  }

  const helper = useMemo(() => {
    if (!value) return helperText

    // The other calendar, always. Someone entering a BS date wants to confirm
    // the Gregorian one the workshop's paperwork will carry, and vice versa.
    const otherText = otherCalendar(value, lang)

    if (!otherText) return helperText

    return helperText ? `${helperText} · ${otherText}` : otherText
  }, [value, lang, helperText])

  const labelNode = label && (
    <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-600">
      {label}
      {isRequired && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  )

  // ── English: the native picker ─────────────────────────────────────────────
  if (lang === 'en') {
    return (
      <div className={className}>
        {labelNode}
        <input
          id={name}
          name={name}
          type="date"
          value={value}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          disabled={disabled}
          min={min}
          max={max}
          className={clsx(
            'input',
            showError && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          )}
        />
        {helper && !showError && <p className="mt-1 text-xs text-ink-400">{helper}</p>}
        {showError && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
      </div>
    )
  }

  // ── Nepali: year / month / day ─────────────────────────────────────────────
  const today = toBs(new Date())
  const currentYear = draft?.year ?? today?.year ?? 2083

  // A window around today rather than the library's full 90-year range: a
  // workshop books services within a couple of years either way, and a select
  // with ninety options is a scroll, not a choice.
  const years = Array.from({ length: 7 }, (_, i) => (today?.year ?? 2083) - 3 + i)
  const months = bsMonthNames('np')
  const days = Array.from(
    { length: bsDaysInMonth(currentYear, draft?.month ?? 1) },
    (_, i) => i + 1,
  )

  const select =
    'input py-2 text-sm ' + (showError ? 'border-rose-300' : '')

  return (
    <div className={className}>
      {labelNode}

      <div className="flex gap-2">
        <select
          className={clsx(select, 'w-[34%]')}
          value={draft?.year ?? ''}
          disabled={disabled}
          onChange={(e) =>
            commit({
              year: Number(e.target.value),
              month: draft?.month ?? 1,
              day: draft?.day ?? 1,
            })
          }
        >
          <option value="" disabled>
            वर्ष
          </option>
          {/* Latin numerals, like every date the app renders. The labels around
              them stay Nepali — the interface is in Nepali, the numbers are
              not. */}
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          className={clsx(select, 'flex-1')}
          value={draft?.month ?? ''}
          disabled={disabled}
          onChange={(e) =>
            commit({
              year: draft?.year ?? currentYear,
              month: Number(e.target.value),
              day: draft?.day ?? 1,
            })
          }
        >
          <option value="" disabled>
            महिना
          </option>
          {/* Numbered as well as named. The date this produces reads
              "2083/04/08", so the month number is the part that has to be
              findable; the name is what makes it recognisable. */}
          {months.map((m, i) => (
            <option key={m} value={i + 1}>
              {String(i + 1).padStart(2, '0')} {m}
            </option>
          ))}
        </select>

        <select
          className={clsx(select, 'w-[24%]')}
          value={draft?.day ?? ''}
          disabled={disabled}
          onChange={(e) =>
            commit({
              year: draft?.year ?? currentYear,
              month: draft?.month ?? 1,
              day: Number(e.target.value),
            })
          }
        >
          <option value="" disabled>
            गते
          </option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        <CalendarDaysIcon className="h-3.5 w-3.5 shrink-0 text-ink-300" />
        {showError ? (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        ) : (
          helper && <p className="text-xs text-ink-400">{helper}</p>
        )}
      </div>
    </div>
  )
}
