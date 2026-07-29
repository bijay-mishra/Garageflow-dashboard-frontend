import { useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { MapPinIcon } from '@heroicons/react/24/outline'
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  PIN_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
  directionsUrl,
} from './mapSetup'
import type { ICustomer } from '@/components/Customer/customer-schema'

interface CustomerMapProps {
  customers: ICustomer[]
  height?: number
}

/**
 * Every pinned customer on one map.
 *
 * Customers without a pin are simply absent — which is most of them, and is why
 * the caller is told how many were left off rather than the map quietly showing
 * a fraction of the list as if it were all of it.
 */
export default function CustomerMap({ customers, height = 420 }: CustomerMapProps) {
  const pinned = useMemo(
    () =>
      customers.filter(
        (c): c is ICustomer & { latitude: number; longitude: number } =>
          c.latitude != null && c.longitude != null,
      ),
    [customers],
  )

  // Centre on the pins there are, so a workshop in Pokhara does not open its map
  // over Kathmandu. The average is crude next to a proper bounds fit, but it has
  // no failure mode when there is exactly one pin.
  const center = useMemo<[number, number]>(() => {
    if (pinned.length === 0) return DEFAULT_CENTER

    const lat = pinned.reduce((sum, c) => sum + c.latitude, 0) / pinned.length
    const lng = pinned.reduce((sum, c) => sum + c.longitude, 0) / pinned.length

    return [lat, lng]
  }, [pinned])

  if (pinned.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-200 px-6 text-center"
        style={{ height }}
      >
        <MapPinIcon className="h-8 w-8 text-ink-300" />
        <p className="mt-2 text-sm font-semibold text-ink-600">No customers pinned yet</p>
        <p className="mt-1 max-w-sm text-xs text-ink-400">
          Edit a customer and drop a pin on the map. Useful for pickup and drop, where a written
          address is often not enough to find the house.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200">
      <MapContainer
        center={center}
        zoom={pinned.length === 1 ? PIN_ZOOM : DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height, width: '100%' }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />

        {pinned.map((customer) => (
          <Marker key={customer.id} position={[customer.latitude, customer.longitude]}>
            <Popup>
              <p className="text-sm font-bold text-ink-900">{customer.name}</p>
              {customer.address && <p className="text-xs text-ink-500">{customer.address}</p>}
              {customer.phone && <p className="text-xs text-ink-500">{customer.phone}</p>}

              <div className="mt-2 flex items-center gap-3 text-xs">
                <Link to={`/customers?q=${encodeURIComponent(customer.name)}`} className="font-semibold text-brand-600">
                  Open record
                </Link>
                {/* Navigation is handed to whatever map app the machine has —
                    turn-by-turn is not something this product should own. */}
                <a
                  href={directionsUrl(customer.latitude, customer.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-600"
                >
                  Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
