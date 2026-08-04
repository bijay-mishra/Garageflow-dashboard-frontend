import NepaliDate from 'nepali-date-converter'

// ── Bikram Sambat ↔ Gregorian ────────────────────────────────────────────────
// A Nepali workshop keeps its books in BS. Every date in the database is
// Gregorian, because that is what a database understands and what the API
// stores — so the conversion belongs here, at the edge, where things are shown
// and typed rather than where they are stored.
//
// The conversion is a lookup table, not arithmetic: BS month lengths vary from
// year to year and are published annually. That is why this uses a maintained
// library rather than the "add 56 years and 8 months" approximation that is
// wrong for roughly half of all dates.
//
// The library covers 2000–2090 BS. Outside that it throws, so everything here
// falls back to the Gregorian value rather than letting an exception reach a
// table cell — a date from 1990 is bad data, and bad data should not blank a
// screen.

/** Nepali month names, Shrawan-first ordering is *not* used — index 0 is Baisakh. */
const BS_MONTHS_NE = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
]

const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
]

/** Devanagari digits, for rendering numbers in a Nepali interface. */
const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

/**
 * Rewrites the ASCII digits in a string as Devanagari.
 *
 * Money and counts only. Dates are deliberately exempt — see the note on
 * `formatDateIn`.
 */
export function toNepaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => NE_DIGITS[Number(d)])
}

/** The reverse, so a typed Nepali numeral can be parsed. */
export function fromNepaliDigits(value: string): string {
  return value.replace(/[०-९]/g, (d) => String(NE_DIGITS.indexOf(d)))
}

export interface BsParts {
  year: number
  /** 1–12, Baisakh first. */
  month: number
  day: number
  monthName: string
}

/** Parses an ISO day string or Date into a local Date, or null. */
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null

  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  // Date-only strings are parsed as UTC by the Date constructor, which shifts
  // them backwards in any timezone west of Greenwich and forwards in Nepal.
  // Split and build locally so "2026-07-30" is the 30th everywhere.
  const dayOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (dayOnly) {
    return new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3]))
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Gregorian → BS. Null when the date is outside the library's range. */
export function toBs(value: string | Date | null | undefined): BsParts | null {
  const date = toDate(value)
  if (!date) return null

  try {
    const bs = new NepaliDate(date)
    return {
      year: bs.getYear(),
      month: bs.getMonth() + 1,
      day: bs.getDate(),
      monthName: BS_MONTHS_EN[bs.getMonth()],
    }
  } catch {
    return null
  }
}

/** BS → Gregorian, as an ISO day string. Null when out of range. */
export function bsToIso(year: number, month: number, day: number): string | null {
  try {
    const ad = new NepaliDate(year, month - 1, day).toJsDate()

    return (
      `${ad.getFullYear()}-` +
      `${String(ad.getMonth() + 1).padStart(2, '0')}-` +
      `${String(ad.getDate()).padStart(2, '0')}`
    )
  } catch {
    return null
  }
}

/** How many days a BS month has — 29 to 32, and it varies by year. */
export function bsDaysInMonth(year: number, month: number): number {
  try {
    const start = new NepaliDate(year, month - 1, 1).toJsDate()

    const next =
      month === 12
        ? new NepaliDate(year + 1, 0, 1).toJsDate()
        : new NepaliDate(year, month, 1).toJsDate()

    return Math.round((next.getTime() - start.getTime()) / 86_400_000)
  } catch {
    // A sane default so a date picker still renders. Out-of-range years are
    // refused on submit by bsToIso, which is the check that matters.
    return 30
  }
}

/** Today, in BS. */
export function todayBs(): BsParts {
  return toBs(new Date()) ?? { year: 2083, month: 1, day: 1, monthName: BS_MONTHS_EN[0] }
}

export function bsMonthName(month: number, language: 'en' | 'np'): string {
  return (language === 'np' ? BS_MONTHS_NE : BS_MONTHS_EN)[month - 1] ?? ''
}

export const bsMonthNames = (language: 'en' | 'np') =>
  language === 'np' ? BS_MONTHS_NE : BS_MONTHS_EN

/** Gregorian month names. Both calendars need a header row in a picker. */
const AD_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const adMonthNames = () => AD_MONTHS

const WEEKDAYS_NE = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Sunday-first, for a picker's header row.
 *
 * One list serves both calendars: BS and Gregorian disagree about months and
 * years, but a week is a week — 2083/04/19 and 2026/08/04 are the same Tuesday.
 */
export const weekdayNames = (language: 'en' | 'np') =>
  language === 'np' ? WEEKDAYS_NE : WEEKDAYS_EN

// ── How a date is written ────────────────────────────────────────────────────
// Year first, zero-padded, slash-separated: 2026/06/12 and 2083/05/08.
//
// Not a style preference. Month names are the one part of a date that does not
// survive being read quickly by somebody who is not reading in their first
// language — "Jun" and "Jul" differ by a letter, "असार" and "साउन" are adjacent
// months — and this is a workshop, where dates are scanned down a column rather
// than read. Numerals sort, align and compare at a glance; names do none of the
// three.
//
// Year-first also makes the two calendars visually parallel. A column of
// 2026/06/12 and a column of 2083/05/08 have their digits in the same places,
// so switching language moves the numbers without moving the layout.

/** `2026/06/12` from a Gregorian date. */
function gregorianNumeric(date: Date): string {
  return (
    `${date.getFullYear()}/` +
    `${String(date.getMonth() + 1).padStart(2, '0')}/` +
    `${String(date.getDate()).padStart(2, '0')}`
  )
}

/** `2083/05/08` from BS parts. */
function bsNumeric(bs: BsParts): string {
  return (
    `${bs.year}/` +
    `${String(bs.month).padStart(2, '0')}/` +
    `${String(bs.day).padStart(2, '0')}`
  )
}

/**
 * A date, in whichever calendar the active language keeps books in.
 *
 * English gets Gregorian — "2026/06/12". Nepali gets Bikram Sambat — but still
 * in Latin numerals, "2083/05/08", not "२०८३/०५/०८".
 *
 * The calendar switches and the script does not, and those really are two
 * separate questions. Which calendar a date is in changes *what day it is*;
 * which numerals it is written in changes only how it looks. A workshop reading
 * the app in Nepali still types plate numbers, phone numbers and amounts on a
 * Latin keypad, and a date column is compared against those and against printed
 * paperwork — Devanagari made it the one field that could not be scanned
 * alongside the rest.
 *
 * Money and counts are unaffected: they still follow the language, because
 * nothing about "Rs 2,400" is ambiguous in either script.
 */
export function formatDateIn(
  value: string | Date | null | undefined,
  language: 'en' | 'np',
): string {
  const date = toDate(value)
  if (!date) return '—'

  if (language === 'en') return gregorianNumeric(date)

  const bs = toBs(date)

  // Outside the conversion range the Gregorian date is the honest answer.
  // Showing a wrong BS date would be worse than showing a right AD one.
  if (!bs) return gregorianNumeric(date)

  return bsNumeric(bs)
}

/**
 * The same date in the other calendar, for a tooltip or a second line.
 *
 * Tagged BS or AD, which the named-month version did not need to be: once both
 * calendars are written as digits, 2083/05/08 and 2026/06/12 are the same shape
 * and only the leading number says which is which.
 */
export function otherCalendar(
  value: string | Date | null | undefined,
  language: 'en' | 'np',
): string | null {
  const date = toDate(value)
  if (!date) return null

  if (language === 'en') {
    const bs = toBs(date)
    return bs ? `${bsNumeric(bs)} BS` : null
  }

  return `${gregorianNumeric(date)} AD`
}

/**
 * A fiscal year's label, in the calendar the interface is speaking.
 *
 * The code stored against every bill is the BS one — "2082/83" — because that
 * is what the accountant, the tax office and the workshop's own paperwork call
 * it. But somebody reading the app in English and looking for last year's
 * figures is thinking in Gregorian, and "2082/83" gives them nothing to match
 * against; digit-swapping it, which is all this used to do, gave them the same
 * string in different numerals.
 *
 * So English reads the Gregorian window off the year's own start and end dates
 * — "2025/26" — rather than deriving it from the BS number. A fiscal year does
 * not line up with either calendar's new year, so the offset is not a constant,
 * and the stored dates are the only thing that knows where the year actually
 * falls.
 */
export function fiscalYearLabel(
  year: { code: string; start?: string | null; end?: string | null },
  language: 'en' | 'np',
): string {
  // Latin numerals in both, like every other date. The BS code is the year's
  // name — it is what the tax office and the workshop's own paperwork call it —
  // and a name should read the same wherever it appears.
  if (language === 'np') return year.code

  const start = toDate(year.start)
  const end = toDate(year.end)

  // No window to read: the BS code is still better than nothing.
  if (!start || !end) return year.code

  const from = start.getFullYear()
  const to = end.getFullYear()

  // A year that opens and closes inside one Gregorian year has nothing to span.
  return from === to ? String(from) : `${from}/${String(to).slice(-2)}`
}
