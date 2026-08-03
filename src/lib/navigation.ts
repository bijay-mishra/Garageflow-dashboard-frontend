// ── Pages outside the menu ───────────────────────────────────────────────────
// The sidebar, the global search and the breadcrumbs all read the server's menu
// now — see src/context/MenuContext.tsx. What is left here is the handful of
// pages that are reachable but deliberately not listed in it.
//
// This file used to hold the whole menu as a hardcoded array. Every workshop got
// the same one, and changing a single row for a single company meant shipping a
// new bundle.

import { SparklesIcon } from '@heroicons/react/24/outline'

export interface NavItem {
  to?: string
  labelKey: string
  icon: typeof SparklesIcon
}

/**
 * Reachable from search and breadcrumbs, never in the sidebar.
 *
 * Plans is linked from the card at the foot of the sidebar rather than listed
 * as a row: it is something you go and look at once, not somewhere you work.
 */
export const EXTRA_PAGES: NavItem[] = [
  { to: '/plans', labelKey: 'nav.plans', icon: SparklesIcon },
]
