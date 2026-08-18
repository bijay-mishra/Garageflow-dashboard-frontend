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
