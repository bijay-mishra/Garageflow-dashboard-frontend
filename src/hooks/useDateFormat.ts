import { useCallback, useMemo } from 'react'
import { useLang } from '@/context/LanguageContext'
import { formatDateIn, otherCalendar, toNepaliDigits } from '@/lib/nepaliDate'
import { formatRs as formatRsAscii, formatNumber as formatNumberAscii } from '@/lib/format'

/**
 * Dates and numbers, in whichever calendar and numerals the navbar is set to.
 *
 * The whole point of routing every date through one hook: switching the
 * language in the topbar has to change every date on the screen at once, and it
 * only does that if nothing formats a date on its own. A component calling
 * `toLocaleDateString` directly is a cell that stays English forever, and that
 * is exactly the half-translated result this avoids.
 *
 * The language is the only input, deliberately. The BS/AD switch on a date
 * field is a typing aid for that field — it does not repaint the tables. Wiring
 * it in here meant one person picking BS in a form left every date on every
 * screen in BS regardless of the language, and no amount of switching the
 * navbar brought them back.
 *
 * Returns stable callbacks, so a table with two hundred date cells does not
 * re-render on every keystroke elsewhere on the page.
 */
export function useDateFormat() {
  const { lang } = useLang()

  const date = useCallback(
    (value: string | Date | null | undefined) => formatDateIn(value, lang),
    [lang],
  )

  /** The same date in the other calendar — for a `title` attribute. */
  const alternate = useCallback(
    (value: string | Date | null | undefined) => otherCalendar(value, lang),
    [lang],
  )

  /**
   * Money. The digits follow the language; the "Rs" does not.
   *
   * "रु" exists and is correct Nepali, but the workshop's own printed invoices
   * say "Rs" and so does every price list in the country. Changing it here
   * would make the screen disagree with the paper it is compared against.
   */
  const rs = useCallback(
    (amount: number, withDecimals = false) => {
      const ascii = formatRsAscii(amount, withDecimals)
      return lang === 'np' ? toNepaliDigits(ascii) : ascii
    },
    [lang],
  )

  const number = useCallback(
    (value: number) => {
      const ascii = formatNumberAscii(value)
      return lang === 'np' ? toNepaliDigits(ascii) : ascii
    },
    [lang],
  )

  /**
   * A bare count or percentage that is already a string.
   *
   * Not for dates or years — those are Latin numerals in both languages, and
   * `date` already handles them. This exists for the cases money and counts
   * do not cover.
   */
  const digits = useCallback(
    (value: string | number) => (lang === 'np' ? toNepaliDigits(value) : String(value)),
    [lang],
  )

  return useMemo(
    () => ({ date, alternate, rs, number, digits, lang }),
    [date, alternate, rs, number, digits, lang],
  )
}
