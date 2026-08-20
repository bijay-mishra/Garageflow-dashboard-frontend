import type { BadgeTone } from '@/components/common/Badge'

/**
 * A service a customer asked for from the app, before it is work.
 *
 * The workshop's side of the same record the customer sees under "My bookings".
 * It stops being a booking the moment it becomes a job card — see `jobCardId`,
 * which is how the customer's history shows what came of their ask.
 */
export interface IBooking {
  id: string
  customerId: string
  customerName: string
  /** So an advisor can ring them without leaving the list. */
  customerPhone: string
  vehicleId: string
  vehiclePlate: string
  vehicleLabel: string
  complaint: string
  /** Date only, `YYYY-MM-DD`. */
  preferredDate: string
  /** Free text — "10:00", "morning", or empty. */
  preferredTime: string
  services: IBookedService[]
  /**
   * Quoted extras only. The complaint itself is unpriced on purpose: nobody
   * can quote "a knocking noise" before they have looked at it.
   */
  estimatedTotal: number
  status: BookingStatus
  staffNote: string | null
  /** True when the customer paid the priority fee to skip the queue. */
  isUrgent: boolean
  /** What skipping the queue cost. Zero on an ordinary booking. */
  urgentFee: number
  /**
   * Where this sits in the garage's queue, 1-based. Null once it is no longer
   * waiting — a converted or cancelled booking is not in a line any more.
   *
   * Worked out by the server across every waiting booking, not across the page,
   * so sorting this table cannot change it.
   */
  queuePosition: number | null
  /** How many bookings are waiting at this garage in total. */
  queueTotal: number
  /** Set once this became real work. */
  jobCardId: string | null
  createdAt: string
  respondedAt: string | null
}

export interface IBookedService {
  serviceId: string
  name: string
  price: number
}

export const BOOKING_STATUSES = [
  'Requested',
  'Confirmed',
  'Rejected',
  'Converted',
  'Cancelled',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const statusLabel: Record<BookingStatus, string> = {
  Requested: 'Requested',
  Confirmed: 'Confirmed',
  Rejected: 'Declined',
  Converted: 'On a job card',
  Cancelled: 'Cancelled',
}

/**
 * Amber for Requested is the point of this screen: it is the only status that
 * is waiting on somebody here, and it should read as an open loop rather than
 * as one more row.
 */
export const statusTone: Record<BookingStatus, BadgeTone> = {
  Requested: 'amber',
  Confirmed: 'blue',
  Rejected: 'gray',
  Converted: 'green',
  Cancelled: 'gray',
}

/** Still waiting on the workshop. */
export const needsAnswer = (booking: IBooking) => booking.status === 'Requested'

/**
 * How a booking's place in the queue should read.
 *
 * Urgent is deliberately its own tone rather than a position with a star on it.
 * The advisor's question is not "where is this in the line" but "why is this at
 * the top", and the answer — they paid for it — has to be visible from across
 * the counter, because it is what the workshop is being held to.
 */
export const queueBadge = (booking: IBooking) => {
  // `== null` catches undefined as well as null, and that is the point: an API
  // that predates the queue omits these fields entirely rather than sending
  // null, and a strict `!== null` check would render "#undefined of undefined"
  // against every server that has not been updated yet.
  if (booking.queuePosition == null) return null

  return {
    tone: booking.isUrgent ? ('violet' as BadgeTone) : ('gray' as BadgeTone),
    label: booking.isUrgent ? 'Urgent' : `#${booking.queuePosition}`,
    // Only the queue's own size is worth showing next to a plain position: "#3
    // of 11" is a wait, "#3" on its own is a number.
    hint: booking.isUrgent ? null : `of ${booking.queueTotal}`,
  }
}
