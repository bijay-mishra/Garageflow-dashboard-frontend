import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useGetNavCounts } from '@/components/Dashboard/dashboard-query'
import { useAuth } from '@/context/AuthContext'
import type { INavCounts } from '@/components/Dashboard/dashboard-schema'

/**
 * Which running total stands behind each menu row.
 *
 * A route with no entry gets no badge, which is most of them — Reports,
 * Services and the settings pages have nothing that *arrives*, and a number
 * beside them would be decoration rather than information.
 */
const COUNT_FOR: Record<string, keyof INavCounts> = {
  '/customers': 'customers',
  '/vehicles': 'vehicles',
  '/bookings': 'bookings',
  '/job-cards': 'jobCards',
  '/billing': 'invoices',
  '/deliveries': 'deliveries',
  '/support': 'support',
}

type Marks = Partial<Record<keyof INavCounts, number>>

/**
 * The last total this browser showed for each section.
 *
 * Per account, because two people sharing a machine have looked at different
 * things, and inheriting somebody else's marks means either a badge for
 * everything or a badge for nothing on the first sign-in.
 */
const keyFor = (email?: string) => `gf_nav_seen:${email ?? 'anon'}`

function read(key: string): Marks {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Marks) : {}
  } catch {
    // A hand-edited or half-written entry should cost the badges, not the
    // sidebar. Starting from nothing re-seeds on the next tick.
    return {}
  }
}

/**
 * "How many arrived here since you last looked" for each sidebar row.
 *
 * The server sends totals and has no idea when anybody last looked — that is
 * a per-browser fact, and keeping it on the server would mean a write on every
 * navigation and a table to hold it. So the mark lives here, and the badge is
 * the difference.
 *
 * A section is marked as soon as you are standing on it, which is what makes
 * the count disappear on click: the route changes, this stamps the current
 * total, and the difference is nought. It also means a badge cannot appear for
 * the page already on screen — three bookings landing while you are reading
 * the bookings list are in front of you, not news.
 *
 * Two cases seed rather than badge. A section never seen on this browser
 * starts at its current total, so a new sign-in is not greeted with "128
 * customers" for rows that have been there for years. And a total that has
 * fallen below its mark — rows deleted — is re-marked, or the badge would stay
 * dark until the section grew back past where it used to be.
 */
export function useNavBadges() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  // The operator console draws its own nav and belongs to no company, so the
  // endpoint has nothing to answer with.
  const { data: counts } = useGetNavCounts(!!user && user.role !== 'SuperAdmin')

  const storageKey = keyFor(user?.email)
  const [marks, setMarks] = useState<Marks>(() => read(storageKey))

  // Signing in as somebody else swaps the whole set rather than merging it.
  useEffect(() => setMarks(read(storageKey)), [storageKey])

  useEffect(() => {
    if (!counts) return

    const next: Marks = { ...marks }
    let changed = false

    for (const [route, field] of Object.entries(COUNT_FOR)) {
      const total = counts[field]
      const mark = next[field]

      const seedIt = mark == null || mark > total
      const standingOnIt = pathname === route || pathname.startsWith(`${route}/`)

      if ((seedIt || standingOnIt) && mark !== total) {
        next[field] = total
        changed = true
      }
    }

    if (!changed) return

    localStorage.setItem(storageKey, JSON.stringify(next))
    setMarks(next)
  }, [counts, pathname, storageKey, marks])

  return (route?: string) => {
    const field = route ? COUNT_FOR[route] : undefined
    if (!field || !counts) return 0

    const mark = marks[field]

    // Not yet seeded. The effect above is one tick behind on the very first
    // load, and showing the raw total in that gap would flash a badge of
    // several hundred before settling to nothing.
    if (mark == null) return 0

    return Math.max(0, counts[field] - mark)
  }
}
