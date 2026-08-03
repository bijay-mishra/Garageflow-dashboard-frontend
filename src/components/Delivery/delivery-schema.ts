import type { BadgeTone } from '@/components/common/Badge'

// ── Handovers ────────────────────────────────────────────────────────────────
// Getting a finished vehicle back to its owner: either they collect it, or
// somebody drives it to them and the customer follows that on a map.

export const DELIVERY_METHODS = ['Pickup', 'HomeDelivery'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const DELIVERY_STATUSES = [
  'AwaitingChoice',
  'Scheduled',
  'OutForDelivery',
  'Delivered',
  'Cancelled',
] as const
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

/** Machine names are one word; a person reading a table is not. */
export const statusLabel: Record<DeliveryStatus, string> = {
  AwaitingChoice: 'Awaiting choice',
  Scheduled: 'Scheduled',
  OutForDelivery: 'Out for delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
}

export const methodLabel: Record<DeliveryMethod, string> = {
  Pickup: 'Collection',
  HomeDelivery: 'Home delivery',
}

/**
 * Status → badge colour.
 *
 * Amber for the one waiting on somebody else, blue for the one in motion, green
 * for done. Deliberately the same scale job cards use, so a glance across two
 * screens means the same thing.
 */
export const statusTone: Record<DeliveryStatus, BadgeTone> = {
  AwaitingChoice: 'amber',
  Scheduled: 'cyan',
  OutForDelivery: 'blue',
  Delivered: 'green',
  Cancelled: 'gray',
}

/** A handover, as `GET /api/deliveries` returns it. */
export interface IDelivery {
  id: string
  jobCardId: string
  customerId: string
  customerName: string
  customerPhone: string
  vehiclePlate: string
  vehicleLabel: string
  method: DeliveryMethod
  status: DeliveryStatus
  address: string

  /** Destination pin. Null for a collection. */
  latitude: number | null
  longitude: number | null

  /** Straight-line km from the workshop, as quoted. */
  distanceKm: number | null

  /** What was charged. Fixed when the customer chose, never recomputed. */
  fee: number

  driver: string
  driverLatitude: number | null
  driverLongitude: number | null
  driverAt: string | null

  createdAt: string
  chosenAt: string | null
  startedAt: string | null
  completedAt: string | null
}

export interface ITrailPoint {
  latitude: number
  longitude: number
  at: string
}

/** A live handover with the route so far — what the map draws. */
export interface IDeliveryTrack {
  delivery: IDelivery
  /** The workshop's pin — where the journey started. */
  originLatitude: number | null
  originLongitude: number | null
  trail: ITrailPoint[]
  /**
   * Seconds since the driver's phone last reported, or null before they set
   * off. Shown rather than assumed: tracking only runs while the driver has the
   * app open, so a position minutes old is normal and a moving dot would lie.
   */
  secondsSinceUpdate: number | null
}

/** Thirty seconds is two missed pings at the app's ten-second interval. */
export const isLive = (track: IDeliveryTrack): boolean =>
  track.secondsSinceUpdate != null && track.secondsSinceUpdate <= 30

/** How fresh a driver's position is, in words. */
export function freshness(seconds: number | null): string {
  if (seconds == null) return 'Not started'
  if (seconds <= 30) return 'Live now'
  if (seconds < 120) return 'A minute ago'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`

  const hours = Math.floor(seconds / 3600)
  return `${hours} hour${hours === 1 ? '' : 's'} ago`
}
