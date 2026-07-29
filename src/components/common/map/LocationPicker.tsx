import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import { searchPlaces, type GeocodeResult } from '@/lib/geocode'
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  PIN_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
} from './mapSetup'

export interface LatLng {
  lat: number
  lng: number
}

interface LocationPickerProps {
  value: LatLng | null
  onChange: (value: LatLng | null) => void
  /**
   * The address typed on the form. Drives the search box, so writing
   * "Kirtipur, Kathmandu" finds and pins it without anyone hunting on the map.
   */
  address?: string
}

/**
 * Finds a place, or lets you drop a pin by hand.
 *
 * Three ways in, in the order people actually reach for them: type an address
 * and let the geocoder find it, use the browser's own location, or click the
 * map. The first is new — placing a pin by eye works but is genuinely hard when
 * you only know the locality, which is the normal case for a workshop taking
 * down a customer's address over the phone.
 *
 * The rule that keeps it predictable: **a pin you placed by hand is never moved
 * by a search.** Search results replace a pin the geocoder itself put there, and
 * otherwise only offer themselves as suggestions. Without that, correcting a
 * typo in the address would silently drag a carefully-placed marker across town.
 */
export default function LocationPicker({ value, onChange, address = '' }: LocationPickerProps) {
  const [query, setQuery] = useState(address)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [matched, setMatched] = useState<string | null>(null)

  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')

  /**
   * Where the current pin came from. A hand-placed pin is the user's judgement
   * and outranks anything the geocoder has to say.
   */
  const pinSource = useRef<'auto' | 'manual' | null>(value ? 'manual' : null)

  // The search box follows the address field until somebody edits it, after
  // which it is theirs — retyping over their refinement would be maddening.
  const searchEdited = useRef(false)

  useEffect(() => {
    if (!searchEdited.current) setQuery(address)
  }, [address])

  // Debounced lookup. 800ms because Nominatim allows one request a second and
  // forbids per-keystroke querying — see lib/geocode.ts.
  useEffect(() => {
    const term = query.trim()

    if (term.length < 3) {
      setResults([])
      setSearched(false)
      return
    }

    const controller = new AbortController()
    setSearching(true)

    const timer = window.setTimeout(async () => {
      const found = await searchPlaces(term, controller.signal)

      if (controller.signal.aborted) return

      setResults(found)
      setSearching(false)
      setSearched(true)

      // Auto-pin only what the geocoder is entitled to move: an empty map, or a
      // pin it placed itself on a previous search.
      if (found.length > 0 && pinSource.current !== 'manual') {
        pinSource.current = 'auto'
        setMatched(found[0].label)
        onChange({ lat: found[0].lat, lng: found[0].lng })
      }
    }, 800)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
      setSearching(false)
    }
    // `onChange` is a fresh closure on every render of the parent form, so it is
    // deliberately not a dependency — including it would restart the search on
    // every keystroke anywhere in the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const choose = (result: GeocodeResult) => {
    // An explicit choice is the user's judgement, so it is treated as manual and
    // will not be overwritten by the next search.
    pinSource.current = 'manual'
    setMatched(result.label)
    setResults([])
    onChange({ lat: result.lat, lng: result.lng })
  }

  const placeByHand = (next: LatLng) => {
    pinSource.current = 'manual'
    setMatched(null)
    setResults([])
    onChange(next)
  }

  const clear = () => {
    pinSource.current = null
    setMatched(null)
    setResults([])
    setError('')
    onChange(null)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser cannot report a location.')
      return
    }

    setLocating(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        placeByHand({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
      // The browser's own wording ("User denied Geolocation") tells nobody what
      // to do about it.
      () => {
        setLocating(false)
        setError('Could not get your location. Allow location access, or click the map.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-600">Location on map</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="btn-soft gap-1 px-2.5 py-1 text-xs disabled:opacity-60"
          >
            <MapPinIcon className="h-3.5 w-3.5" />
            {locating ? 'Locating…' : 'Use my location'}
          </button>
          {value && (
            <button type="button" onClick={clear} className="btn-soft gap-1 px-2.5 py-1 text-xs">
              <XMarkIcon className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Search. Seeded from the address above, so in the common case the pin
          lands without anyone touching this at all. */}
      <div className="relative mb-2">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => {
            searchEdited.current = true
            setQuery(e.target.value)
          }}
          // Enter inside a form submits it, and searching is not saving.
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          placeholder="Search a place — Kirtipur, Kathmandu"
          className="input h-9 pl-10 pr-9"
          aria-label="Search for a place"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner />
          </span>
        )}
      </div>

      {/* Alternatives, when the first hit was not the right one. */}
      {results.length > 1 && (
        <ul className="mb-2 max-h-36 overflow-y-auto rounded-lg border border-ink-200">
          {results.map((result, index) => (
            <li key={`${result.lat},${result.lng}`}>
              <button
                type="button"
                onClick={() => choose(result)}
                className="flex w-full items-start gap-2 border-b border-ink-100 px-3 py-2 text-left last:border-b-0 hover:bg-ink-50"
              >
                <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-ink-800">
                    {result.shortLabel}
                  </span>
                  <span className="block truncate text-xs text-ink-400">{result.label}</span>
                </span>
                {index === 0 && pinSource.current === 'auto' && (
                  <span className="ml-auto shrink-0 text-xs font-semibold text-brand-600">
                    pinned
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="overflow-hidden rounded-lg border border-ink-200">
        <MapContainer
          center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
          zoom={value ? PIN_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom={false}
          style={{ height: 240, width: '100%' }}
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <ClickToPlace onPlace={placeByHand} />
          <RecenterOnValue value={value} />
          {value && <Marker position={[value.lat, value.lng]} />}
        </MapContainer>
      </div>

      <p className="mt-1.5 text-xs text-ink-400">
        {matched ? (
          <>
            Pinned to <span className="font-medium text-ink-600">{matched}</span>. Not quite right?
            Click the map to move it.
          </>
        ) : value ? (
          <>
            Pinned at {value.lat.toFixed(5)}, {value.lng.toFixed(5)}. Click the map to move it.
          </>
        ) : searched && !searching && results.length === 0 ? (
          // A geocoder miss is common for a small locality and is not an error —
          // the map is still right there.
          <>Could not find that place. Click the map to place the pin yourself.</>
        ) : (
          <>Optional. Type an address above, or click the map to drop a pin.</>
        )}
      </p>

      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

/** Turns a click anywhere on the map into a pin. */
function ClickToPlace({ onPlace }: { onPlace: (value: LatLng) => void }) {
  useMapEvents({
    click: (event: LeafletMouseEvent) => onPlace({ lat: event.latlng.lat, lng: event.latlng.lng }),
  })

  return null
}

/**
 * Moves the view when the pin arrives from outside the map — a search result,
 * "use my location", or an existing pin loading after mount.
 *
 * `MapContainer`'s `center` is read once and ignored afterwards, which is a
 * well-known Leaflet trap: without this the map stays on Kathmandu while the
 * marker sits somewhere off-screen.
 */
function RecenterOnValue({ value }: { value: LatLng | null }) {
  const map = useMapEvents({})
  const [lastKey, setLastKey] = useState<string | null>(null)
  const key = value ? `${value.lat},${value.lng}` : null

  if (key !== lastKey) {
    setLastKey(key)
    // Only follows a pin that came from elsewhere. A click already centres
    // itself, and re-centring on every click would drag the map out from under
    // someone placing a second pin nearby.
    if (value && map.distance(map.getCenter(), [value.lat, value.lng]) > 200) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), PIN_ZOOM))
    }
  }

  return null
}
