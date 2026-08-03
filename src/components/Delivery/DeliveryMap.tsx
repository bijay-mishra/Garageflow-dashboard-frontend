import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { TruckIcon } from '@heroicons/react/24/outline'
import {
  DEFAULT_CENTER,
  PIN_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
  directionsUrl,
} from '@/components/common/map/mapSetup'
import { formatRs } from '@/lib/format'
import { freshness, isLive, type IDeliveryTrack } from './delivery-schema'

interface DeliveryMapProps {
  track: IDeliveryTrack
  height?: number
}

/**
 * Where the van is, and where it has been.
 *
 * Divergence from the customer app is deliberate on one point: the workshop sees
 * the whole trail, because it is a record of the run. Both ends draw straight
 * lines between reported points rather than a road route — the server computes
 * straight-line distance, and drawing a road path on top of that would present a
 * guess as a measurement.
 */
export default function DeliveryMap({ track, height = 440 }: DeliveryMapProps) {
  const { delivery } = track
  const live = isLive(track)

  const origin = useMemo<[number, number] | null>(
    () =>
      track.originLatitude != null && track.originLongitude != null
        ? [track.originLatitude, track.originLongitude]
        : null,
    [track.originLatitude, track.originLongitude],
  )

  const destination = useMemo<[number, number] | null>(
    () =>
      delivery.latitude != null && delivery.longitude != null
        ? [delivery.latitude, delivery.longitude]
        : null,
    [delivery.latitude, delivery.longitude],
  )

  const driver = useMemo<[number, number] | null>(
    () =>
      delivery.driverLatitude != null && delivery.driverLongitude != null
        ? [delivery.driverLatitude, delivery.driverLongitude]
        : null,
    [delivery.driverLatitude, delivery.driverLongitude],
  )

  const trail = useMemo<[number, number][]>(
    () => track.trail.map((p) => [p.latitude, p.longitude]),
    [track.trail],
  )

  const points = useMemo(
    () => [origin, destination, driver].filter((p): p is [number, number] => p != null),
    [origin, destination, driver],
  )

  if (points.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ink-200 px-6 text-center"
        style={{ height }}
      >
        <TruckIcon className="h-8 w-8 text-ink-300" />
        <p className="mt-2 text-sm font-semibold text-ink-600">Nothing to plot yet</p>
        <p className="mt-1 max-w-sm text-xs text-ink-400">
          The map fills in once the workshop has a pin and the driver sets off.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200">
      <MapContainer
        center={points[0]}
        zoom={PIN_ZOOM - 3}
        scrollWheelZoom
        style={{ height, width: '100%' }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <FitToPoints points={points} />

        {trail.length > 1 && (
          <Polyline positions={trail} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.75 }} />
        )}

        {origin && (
          <Marker position={origin} icon={dotIcon('#334155', 'W')}>
            <Popup>
              <p className="text-sm font-bold text-ink-900">The workshop</p>
              <p className="text-xs text-ink-500">Where the run started</p>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={destination}>
            <Popup>
              <p className="text-sm font-bold text-ink-900">{delivery.customerName}</p>
              {delivery.address && <p className="text-xs text-ink-500">{delivery.address}</p>}
              <p className="mt-1 text-xs text-ink-500">
                {delivery.distanceKm != null && `${delivery.distanceKm.toFixed(1)} km · `}
                {delivery.fee === 0 ? 'Free delivery' : formatRs(delivery.fee)}
              </p>
              <a
                href={directionsUrl(destination[0], destination[1])}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-brand-600"
              >
                Directions
              </a>
            </Popup>
          </Marker>
        )}

        {driver && (
          <Marker position={driver} icon={dotIcon(live ? '#2563eb' : '#94a3b8', '🚚')}>
            <Popup>
              <p className="text-sm font-bold text-ink-900">
                {delivery.driver || 'Driver'}
              </p>
              {/* The honest part. A stale dot presented as current is the one
                  way this screen could actively mislead someone. */}
              <p className="text-xs text-ink-500">{freshness(track.secondsSinceUpdate)}</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

/**
 * Keeps every pin in frame as they move.
 *
 * A child component rather than a ref on the container, because `useMap` is the
 * only way to reach the Leaflet instance from inside react-leaflet, and the fit
 * has to re-run on each poll as the driver's marker moves.
 */
function FitToPoints({ points }: { points: [number, number][] }) {
  const map = useMap()

  // Only auto-fits until the user takes over. A map that yanks itself back every
  // ten seconds while somebody is trying to look at a street is unusable.
  const userMoved = useRef(false)

  useEffect(() => {
    const takeOver = () => {
      userMoved.current = true
    }

    map.on('dragstart', takeOver)
    map.on('zoomstart', takeOver)

    return () => {
      map.off('dragstart', takeOver)
      map.off('zoomstart', takeOver)
    }
  }, [map])

  useEffect(() => {
    if (userMoved.current || points.length === 0) return

    if (points.length === 1) {
      map.setView(points[0], PIN_ZOOM)
      return
    }

    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: PIN_ZOOM })
  }, [map, points])

  return null
}

/** A coloured disc with a glyph, so the three pins are told apart at a glance. */
const dotIcon = (color: string, glyph: string) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="
      width:30px;height:30px;border-radius:9999px;
      background:${color};border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(15,23,42,.35);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:13px;font-weight:800;line-height:1;
    ">${glyph}</div>`,
  })

export const DEFAULT_MAP_CENTER = DEFAULT_CENTER
