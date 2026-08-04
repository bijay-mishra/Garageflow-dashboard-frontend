import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { FormikProps } from 'formik'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import Flag from '@/components/common/Flag'
import { useLang } from '@/context/LanguageContext'
import { useCalendar, type Calendar } from '@/lib/calendarPref'
import {
  adMonthNames,
  bsDaysInMonth,
  bsMonthNames,
  bsToIso,
  toBs,
  weekdayNames,
} from '@/lib/nepaliDate'

interface DateInputProps {
  name: string
  label?: string
  formik: FormikProps<any>
  isRequired?: boolean
  disabled?: boolean
  /** ISO day strings, in Gregorian — same as the stored value. */
  min?: string
  max?: string
  className?: string
  /** Shown under the field. The converted date is appended to it. */
  helperText?: string
}

// ── Calendar-agnostic arithmetic ─────────────────────────────────────────────
// Everything below works in whichever calendar is passed in, so the field, the
// grid and the month header are written once rather than twice. `bs` goes
// through the conversion table in lib/nepaliDate; `ad` is plain JS Date.

const pad = (n: number) => String(n).padStart(2, '0')

interface Parts {
  year: number
  /** 1–12. */
  month: number
  day: number
}

/** An ISO Gregorian day string as it is written in the given calendar. */
function partsOf(iso: string, calendar: Calendar): Parts | null {
  if (!iso) return null

  if (calendar === 'bs') {
    const bs = toBs(iso)
    return bs ? { year: bs.year, month: bs.month, day: bs.day } : null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return match ? { year: +match[1], month: +match[2], day: +match[3] } : null
}

/**
 * The reverse. Null when that day does not exist — Chaitra 32 in a year where
 * Chaitra has 30, or the 31st of a 30-day Gregorian month. Returning null
 * rather than rolling over is the point: a picker that silently turns the 31st
 * of June into the 1st of July has changed the date behind somebody's back.
 */
function isoOf(parts: Parts, calendar: Calendar): string | null {
  const { year, month, day } = parts

  if (month < 1 || month > 12 || day < 1) return null

  if (calendar === 'bs') return bsToIso(year, month, day)

  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return `${year}-${pad(month)}-${pad(day)}`
}

function daysInMonth(year: number, month: number, calendar: Calendar): number {
  // Day 0 of the next month is the last day of this one.
  return calendar === 'bs' ? bsDaysInMonth(year, month) : new Date(year, month, 0).getDate()
}

/** Which column the 1st falls in, Sunday = 0. */
function firstWeekday(year: number, month: number, calendar: Calendar): number {
  const iso = isoOf({ year, month, day: 1 }, calendar)
  if (!iso) return 0

  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

function monthNamesFor(calendar: Calendar, language: 'en' | 'np'): string[] {
  return calendar === 'bs' ? bsMonthNames(language) : adMonthNames()
}

/** `2083/04/19` — year first, zero-padded, as everywhere else in the app. */
function display(parts: Parts): string {
  return `${parts.year}/${pad(parts.month)}/${pad(parts.day)}`
}

/**
 * Types the separators for you: `20830419` becomes `2083/04/19` as you go.
 * Anything that is not a digit is dropped, so pasting `2083-04-19` works too.
 */
function mask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`

  return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`
}

function parse(text: string): Parts | null {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text.trim())
  return match ? { year: +match[1], month: +match[2], day: +match[3] } : null
}

/**
 * A date field that can be typed and picked in either calendar.
 *
 * The calendar is a switch on the field — the flag button — not a consequence
 * of the interface language. It used to be the latter: English got the browser's
 * native picker and Nepali got three BS selects, so a workshop reading the app
 * in English had no way to enter the BS date the customer had just given them
 * short of switching the whole interface to Nepali and back.
 *
 * Both calendars now get the same control: a typed box with the separators
 * filled in for you, and a month grid. The BS grid is generated from the
 * conversion table rather than from arithmetic — month lengths run 29 to 32 and
 * vary by year — so it cannot offer a day that does not exist.
 *
 * The value stored on the form is an ISO Gregorian day string in both modes, so
 * validation, the API and the database have no idea this component exists.
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
  const { lang, t } = useLang()
  const [calendar, setCalendar] = useCalendar(lang)

  const value = (formik.values[name] as string | undefined) ?? ''
  const error = formik.errors[name] as string | undefined
  const showError = Boolean(error) && (Boolean(formik.touched[name]) || formik.submitCount > 0)

  const parts = useMemo(() => partsOf(value, calendar), [value, calendar])

  // What is in the box. Kept separate from the form value so a half-typed date
  // neither writes rubbish to the form nor gets erased mid-keystroke.
  const [text, setText] = useState(() => (parts ? display(parts) : ''))
  const [badDate, setBadDate] = useState(false)
  const [open, setOpen] = useState(false)

  const boxRef = useRef<HTMLDivElement>(null)

  // Re-render the box whenever the committed value or the calendar changes —
  // switching calendar rewrites the same day in the other notation.
  useEffect(() => {
    setText(parts ? display(parts) : '')
    setBadDate(false)
  }, [parts?.year, parts?.month, parts?.day, calendar]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return

    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const commit = (iso: string) => {
    formik.setFieldValue(name, iso)
    formik.setFieldTouched(name, true, false)
  }

  const onType = (raw: string) => {
    const next = mask(raw)
    setText(next)

    if (next === '') {
      setBadDate(false)
      commit('')
      return
    }

    const typed = parse(next)

    // Only judge it once all eight digits are in — flagging "2083/0" as invalid
    // while somebody is still typing the month is noise.
    if (!typed) {
      setBadDate(false)
      return
    }

    const iso = isoOf(typed, calendar)

    setBadDate(!iso)
    if (iso) commit(iso)
  }

  const onBlurField = () => {
    formik.setFieldTouched(name, true, true)

    // Put the box back to the last date that was actually accepted, so a field
    // left half-typed does not sit there looking like a saved value.
    if (text !== '' && !isoOf(parse(text) ?? { year: 0, month: 0, day: 0 }, calendar)) {
      setText(parts ? display(parts) : '')
      setBadDate(false)
    }
  }

  // Only what the caller asked for. The same day in the other calendar used to
  // be appended here automatically, which put a second date under every field —
  // two dates where the form holds one is a thing to reconcile, not a help.
  const message = showError ? error : badDate ? t('date.invalid') : helperText || null
  const tone = showError || badDate ? 'text-rose-600 font-medium' : 'text-ink-400'

  const nextCalendar: Calendar = calendar === 'bs' ? 'ad' : 'bs'

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-600">
          {label}
          {isRequired && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative" ref={boxRef}>
        <input
          id={name}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          onChange={(e) => onType(e.target.value)}
          onBlur={onBlurField}
          disabled={disabled}
          placeholder={t('date.placeholder')}
          aria-invalid={showError || badDate}
          className={clsx(
            'input pr-[4.25rem] tabular-nums',
            (showError || badDate) && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          )}
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {/* The calendar switch. Shows the calendar you are in; the tooltip
              says the one you would get. */}
          <button
            type="button"
            onClick={() => setCalendar(nextCalendar)}
            disabled={disabled}
            title={t(calendar === 'bs' ? 'date.switchToAd' : 'date.switchToBs')}
            aria-label={t(calendar === 'bs' ? 'date.switchToAd' : 'date.switchToBs')}
            className="flex h-6 w-7 items-center justify-center rounded-md transition hover:bg-ink-50 disabled:opacity-40"
          >
            {/* The same two flags as the language switcher in the navbar, at
                their own aspect ratios — the UK is 2:1, Nepal is taller than it
                is wide. No "BS"/"AD" caption: it repeated what the flag says and
                cost the field a third of its width, which is why the date was
                truncating to "2083,". The tooltip carries the long form. */}
            {calendar === 'bs' ? <Flag code="np" className="h-4" /> : <Flag code="gb" className="h-3" />}
          </button>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={disabled}
            title={t('date.openCalendar')}
            aria-label={t('date.openCalendar')}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={clsx(
              'flex h-6 w-6 items-center justify-center rounded-md transition disabled:opacity-40',
              open ? 'bg-brand-50 text-brand-600' : 'text-ink-400 hover:bg-ink-50 hover:text-ink-700',
            )}
          >
            <CalendarDaysIcon className="h-4 w-4" />
          </button>
        </div>

        {open && !disabled && (
          <CalendarGrid
            calendar={calendar}
            lang={lang}
            selected={value}
            min={min}
            max={max}
            onPick={(iso) => {
              commit(iso)
              setOpen(false)
            }}
            onClear={() => {
              commit('')
              setOpen(false)
            }}
          />
        )}
      </div>

      {message && <p className={clsx('mt-1 text-xs', tone)}>{message}</p>}
    </div>
  )
}

/**
 * A month of whichever calendar is active.
 *
 * Every cell is built by asking the conversion table for a real ISO day, so a
 * day that cannot be converted is never drawn. That is what makes a BS grid
 * safe to render at all: the shape of a BS month is a published table, not a
 * rule, and a grid that guesses looks exactly as authoritative as one that
 * knows.
 */
function CalendarGrid({
  calendar,
  lang,
  selected,
  min,
  max,
  onPick,
  onClear,
}: {
  calendar: Calendar
  lang: 'en' | 'np'
  /** ISO day string, or ''. */
  selected: string
  min?: string
  max?: string
  onPick: (iso: string) => void
  onClear: () => void
}) {
  const { t } = useLang()

  const todayIso = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  }, [])

  const anchor = partsOf(selected, calendar) ?? partsOf(todayIso, calendar)

  const [view, setView] = useState<{ year: number; month: number }>(() => ({
    year: anchor?.year ?? 2083,
    month: anchor?.month ?? 1,
  }))

  const months = monthNamesFor(calendar, lang)
  const weekdays = weekdayNames(lang)

  // A window around the year in view. The BS table covers 2000–2090 and a
  // workshop books within a couple of years either way, so ninety options in a
  // select would be a scroll rather than a choice.
  const years = Array.from({ length: 21 }, (_, i) => view.year - 10 + i)

  const step = (by: number) => {
    setView((v) => {
      const month = v.month + by

      if (month < 1) return { year: v.year - 1, month: 12 }
      if (month > 12) return { year: v.year + 1, month: 1 }

      return { year: v.year, month }
    })
  }

  const lead = firstWeekday(view.year, view.month, calendar)
  const total = daysInMonth(view.year, view.month, calendar)

  const cells = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]

  return (
    <div
      role="dialog"
      aria-label={t('date.openCalendar')}
      className="absolute left-0 top-full z-30 mt-2 w-[19rem] rounded-xl border border-ink-100 bg-white p-3 shadow-soft animate-fade-in"
    >
      <div className="mb-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label={t('date.prevMonth')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <select
          value={view.month}
          onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))}
          aria-label={t('date.month')}
          className="min-w-0 flex-1 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs font-semibold text-ink-800 outline-none transition focus:border-brand-400"
        >
          {months.map((m, i) => (
            <option key={m} value={i + 1}>
              {pad(i + 1)} {m}
            </option>
          ))}
        </select>

        <select
          value={view.year}
          onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))}
          aria-label={t('date.year')}
          className="shrink-0 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs font-semibold tabular-nums text-ink-800 outline-none transition focus:border-brand-400"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label={t('date.nextMonth')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weekdays.map((d, i) => (
          <span
            key={d}
            className={clsx(
              'py-1 text-center text-[10px] font-semibold uppercase tracking-wide',
              // Saturday is the weekend in Nepal, not Sunday.
              i === 6 ? 'text-rose-400' : 'text-ink-400',
            )}
          >
            {d}
          </span>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />

          const iso = isoOf({ year: view.year, month: view.month, day }, calendar)

          // Unconvertible, so there is nothing honest to store. Drawn flat and
          // dead rather than left out, which would shift the whole grid.
          if (!iso) {
            return (
              <span key={day} className="py-1.5 text-center text-xs text-ink-200">
                {day}
              </span>
            )
          }

          const outOfRange = (min && iso < min) || (max && iso > max)
          const isSelected = iso === selected
          const isToday = iso === todayIso

          return (
            <button
              key={day}
              type="button"
              disabled={Boolean(outOfRange)}
              onClick={() => onPick(iso)}
              aria-current={isSelected ? 'date' : undefined}
              className={clsx(
                'rounded-md py-1.5 text-center text-xs tabular-nums transition',
                outOfRange && 'cursor-not-allowed text-ink-200',
                !outOfRange && isSelected && 'bg-brand-600 font-bold text-white',
                !outOfRange && !isSelected && isToday && 'font-bold text-brand-600 ring-1 ring-brand-300',
                !outOfRange && !isSelected && !isToday && 'text-ink-700 hover:bg-ink-50',
              )}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2">
        <button
          type="button"
          onClick={() => onPick(todayIso)}
          className="rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
        >
          {t('date.today')}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1 text-xs font-medium text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
        >
          {t('date.clear')}
        </button>
      </div>
    </div>
  )
}
