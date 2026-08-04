import { useCallback, useSyncExternalStore } from 'react'
import type { Lang } from './i18n'

// ── Which calendar dates are typed in ────────────────────────────────────────
// Not the same question as which language the interface speaks, which is why
// this is its own preference rather than a branch on `lang`.
//
// A workshop reading the app in English still takes bookings in BS, because the
// customer on the phone says "asar 19" and the job card that gets printed is
// filed against the BS year. The reverse happens too: the same workshop typing
// a warranty date off a manufacturer's sheet has a Gregorian date in front of
// it. Tying the calendar to the language forced a language switch — and with it
// every label on the screen — to type one date.
//
// The value stored on the form is an ISO Gregorian day either way. This only
// decides what the field shows and what a typed number means.

export type Calendar = 'bs' | 'ad'

const KEY = 'gf_calendar'

function read(): Calendar | null {
  try {
    const stored = localStorage.getItem(KEY)
    return stored === 'bs' || stored === 'ad' ? stored : null
  } catch {
    // Private browsing, or storage disabled. The preference is a convenience,
    // not something worth taking the form down for.
    return null
  }
}

let current = read()
const listeners = new Set<() => void>()

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Stable between writes, which is what `useSyncExternalStore` requires. */
function snapshot() {
  return current
}

/**
 * Every date field on screen follows this, deliberately. A form with a booking
 * date and a promised date should not need switching twice, and a job card with
 * one field in BS and the next in AD is how a wrong date gets saved.
 */
export function setCalendar(next: Calendar) {
  if (current === next) return

  current = next

  try {
    localStorage.setItem(KEY, next)
  } catch {
    // Not persisted, but the session still switches.
  }

  listeners.forEach((fn) => fn())
}

/**
 * The active calendar and a setter.
 *
 * Falls back to the interface language until somebody chooses — Nepali reads in
 * BS, English in AD — so the default is right without anybody being asked, and
 * the choice sticks once it is made.
 */
export function useCalendar(lang: Lang): [Calendar, (next: Calendar) => void] {
  const stored = useSyncExternalStore(subscribe, snapshot, snapshot)
  const calendar: Calendar = stored ?? (lang === 'np' ? 'bs' : 'ad')

  return [calendar, useCallback((next: Calendar) => setCalendar(next), [])]
}
