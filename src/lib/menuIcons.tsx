import {
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  ListBulletIcon,
  MapIcon,
  Squares2X2Icon,
  SparklesIcon,
  TruckIcon,
  UserCircleIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

// ── Menu icons ───────────────────────────────────────────────────────────────
// The server sends an icon *name*; this is where a name becomes a component.
//
// It has to be a lookup rather than a dynamic import: the icon set is a bundle
// of ~300 components, and letting the server name any of them would mean
// shipping all of them. This list is what the sidebar can draw, and adding to
// it is a deliberate change on both sides.

export type IconComponent = typeof HomeIcon

const ICONS: Record<string, IconComponent> = {
  home: HomeIcon,
  users: UsersIcon,
  truck: TruckIcon,
  clipboard: ClipboardDocumentListIcon,
  sparkles: SparklesIcon,
  wrench: WrenchScrewdriverIcon,
  banknotes: BanknotesIcon,
  map: MapIcon,
  chart: ChartBarIcon,
  cog: Cog6ToothIcon,
  storefront: BuildingStorefrontIcon,
  userGroup: UserGroupIcon,
  userCircle: UserCircleIcon,
  listBullet: ListBulletIcon,
  adjustments: AdjustmentsHorizontalIcon,
  grid: Squares2X2Icon,
}

/**
 * The component for an icon name.
 *
 * An unknown name falls back rather than throwing. A menu row is worth drawing
 * even if its picture is wrong — a renamed icon should cost a generic square,
 * not the whole sidebar.
 */
export const iconFor = (name: string): IconComponent => ICONS[name] ?? Squares2X2Icon

/** Names an operator can choose from, for the console's menu editor. */
export const ICON_NAMES = Object.keys(ICONS)
