import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Leaflet setup ────────────────────────────────────────────────────────────
// Imported once by every map component. Two things have to happen before a map
// will render correctly, and both are easy to miss because the failure is
// silent: the stylesheet above (without it tiles stack in a column), and the
// marker icon fix below.

/**
 * Leaflet's default marker is a PNG it resolves at runtime from the page URL.
 * Vite bundles and hashes assets, so that path does not exist and every marker
 * renders as a broken image. Pointing the icon at the bundled files fixes it.
 */
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

/**
 * OpenStreetMap's public tile server.
 *
 * Free and needs no key, which is why it was chosen over Google Maps — no
 * billing account, no card, and the same behaviour in every country the product
 * might reach. The trade is the usage policy: OSM asks for attribution (below,
 * and it must stay visible) and it is not built for heavy commercial traffic.
 * A busy deployment should move to a paid tile host — MapTiler, Stadia, Thunderforest —
 * which is a one-line change to `TILE_URL` and nothing else.
 */
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Required by the OpenStreetMap tile usage policy. Do not remove. */
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

/**
 * Where a map opens when there is nothing to centre on — Kathmandu.
 *
 * A blank map defaults to the middle of the Atlantic, which reads as broken.
 * This is only a starting view; the moment there is a pin, the map goes there.
 */
export const DEFAULT_CENTER: [number, number] = [27.7172, 85.324]
export const DEFAULT_ZOOM = 12

/** Close enough to see a street when a single pin is being shown or placed. */
export const PIN_ZOOM = 16

/**
 * A link that opens the location in whatever map app the device has.
 *
 * `geo:` would be more correct on a phone and does nothing on a desktop, so this
 * uses the Google Maps URL scheme — every platform either opens the app or falls
 * back to the website. Handing navigation off is deliberate: turn-by-turn is not
 * something this product should try to own.
 */
export const directionsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
