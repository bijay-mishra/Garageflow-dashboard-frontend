// ── Primary navigation ───────────────────────────────────────────────────────
// Single source of truth for the sidebar menu. The global search and the
// breadcrumbs read the same list, so every entry stays reachable and labelled.

import {
  Squares2X2Icon,
  HomeIcon,
  UsersIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  SparklesIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

export interface NavItem {
  /** Omitted on group parents that only exist to hold children. */
  to?: string
  labelKey: string
  icon: typeof Squares2X2Icon
  end?: boolean
  /** Nested menu — rendered as a collapsible group in the sidebar. */
  children?: NavItem[]
}

/** Sits above the "Modules" heading, on its own. */
export const HOME: NavItem = { to: '/', labelKey: 'nav.home', icon: HomeIcon, end: true }

/** Everything under the "Modules" heading. */
export const NAV: NavItem[] = [
  { to: '/customers', labelKey: 'nav.customers', icon: UsersIcon },
  { to: '/vehicles', labelKey: 'nav.vehicles', icon: TruckIcon },
  { to: '/job-cards', labelKey: 'nav.jobCards', icon: ClipboardDocumentListIcon },
  // The price list, above the record of work done — you set up what you sell
  // before you can look back at having sold it.
  { to: '/services', labelKey: 'nav.services', icon: SparklesIcon },
  { to: '/service-history', labelKey: 'nav.serviceHistory', icon: WrenchScrewdriverIcon },
  { to: '/billing', labelKey: 'nav.billing', icon: BanknotesIcon },
  { to: '/reports', labelKey: 'nav.reports', icon: ChartBarIcon },
  {
    labelKey: 'nav.settings',
    icon: Cog6ToothIcon,
    children: [
      { to: '/workshop', labelKey: 'nav.workshop', icon: BuildingStorefrontIcon },
      { to: '/staff', labelKey: 'nav.staff', icon: UserGroupIcon },
      { to: '/account', labelKey: 'topbar.myAccount', icon: UserCircleIcon },
    ],
  },
]

/** Every navigable entry, Home included and groups flattened — for search and
 *  breadcrumb lookup. */
export function flatNav(items: NavItem[] = [HOME, ...NAV]): NavItem[] {
  return items.flatMap((item) => (item.children ? [item, ...flatNav(item.children)] : [item])).filter((i) => i.to)
}

/** The group a route sits under, if any — used for the breadcrumb trail. */
export function groupOf(to: string): NavItem | undefined {
  return NAV.find((item) => item.children?.some((child) => child.to === to))
}

/** Pages reachable from search and breadcrumbs but not listed in the sidebar. */
export const EXTRA_PAGES: NavItem[] = [{ to: '/plans', labelKey: 'nav.plans', icon: SparklesIcon }]
