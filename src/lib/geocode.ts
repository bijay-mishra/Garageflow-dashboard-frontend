// ── Turning an address into a map pin ────────────────────────────────────────
// Nominatim is OpenStreetMap's own geocoder: free, no API key, no billing
// account — the same reasoning that picked OSM for the tiles.
//
// The catch is its usage policy, which is strict and worth honouring rather than
// discovering the hard way when the workshop's IP gets blocked:
//
//   • at most one request per second, absolutely
//   • no bulk or autocomplete-style querying (a request per keystroke is
//     exactly what it forbids)
//   • identify the application
//
// Everything below exists to stay inside those rules: the caller debounces, and
// `throttle()` here is a second gate so a burst can never slip through even if
// some future caller forgets to.
//
// If this ever gets heavy — many branches, staff geocoding all day — move to a
// paid geocoder with a key (LocationIQ, MapTiler and Geoapify all speak a nearly
// identical API and have free tiers). That is a change to `ENDPOINT` and the
// response mapping, and nothing else.

const ENDPOINT = 'https://nominatim.openstreetmap.org/search'

/**
 * Bias results to Nepal.
 *
 * Without it "Kirtipur" also matches places in India, and the top hit for a
 * short Nepali locality is often the wrong country. Remove this — or make it a
 * workshop setting — on the day the product runs somewhere else.
 */
const COUNTRY_CODES = 'np'

/** One match from the geocoder. */
export interface GeocodeResult {
  /** Full formatted name — "Kirtipur, Kathmandu, Bagmati Province, Nepal". */
  label: string
  /** Shortened for a list row — the first two components. */
  shortLabel: string
  lat: number
  lng: number
}

/** Nominatim's shape, narrowed to what is actually read. */
interface NominatimPlace {
  display_name: string
  lat: string
  lon: string
}

let lastRequestAt = 0

/** Holds the caller until at least a second has passed since the last request. */
async function throttle(): Promise<void> {
  const wait = 1000 - (Date.now() - lastRequestAt)
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
  lastRequestAt = Date.now()
}

/**
 * Finds places matching a written address.
 *
 * Returns an empty array rather than throwing when nothing matches or the
 * lookup fails — a geocoder being unreachable must never stop somebody saving a
 * customer, and the map can always be clicked by hand.
 *
 * Pass an `AbortSignal` so a superseded search is dropped: without it a slow
 * response for "Kirt" can land after the one for "Kirtipur" and overwrite it.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const term = query.trim()

  // Two characters match half the country and waste a request against the
  // one-per-second budget.
  if (term.length < 3) return []

  await throttle()

  if (signal?.aborted) return []

  const url =
    `${ENDPOINT}?format=jsonv2&limit=5&addressdetails=0` +
    `&countrycodes=${COUNTRY_CODES}` +
    // English first, Nepali where there is no English name. Without this the
    // labels come back in Devanagari — correct, but jarring next to an address
    // somebody just typed in English, and impossible to check at a glance
    // against what they meant.
    `&accept-language=en,ne` +
    `&q=${encodeURIComponent(term)}`

  try {
    const response = await fetch(url, {
      signal,
      headers: {
        // Nominatim asks callers to identify themselves. A browser will not let
        // us set User-Agent, so this is the honest best available; the Referer
        // the browser sends does the rest.
        Accept: 'application/json',
      },
    })

    if (!response.ok) return []

    const places = (await response.json()) as NominatimPlace[]

    return places.map((place) => ({
      label: place.display_name,
      // "Kirtipur, Kathmandu, Bagmati Province, Nepal" is too long for a list
      // row, and the tail is the same for every Nepali result anyway.
      shortLabel: place.display_name.split(',').slice(0, 2).join(',').trim(),
      lat: Number(place.lat),
      lng: Number(place.lon),
    }))
  } catch {
    // Aborted, offline, or blocked. All three mean the same thing to the
    // caller: no suggestions, place the pin by hand.
    return []
  }
}
