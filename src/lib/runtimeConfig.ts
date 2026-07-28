// ── Runtime configuration ────────────────────────────────────────────────────
// Read from `public/config.json` when the app boots — the same pattern the ERP
// client uses. Because it is fetched at run time rather than compiled in, one
// build can be pointed at any backend by editing the deployed config.json: no
// rebuild, no environment variables.
//
// `baseUrl` is a list of { subdomain: url } pairs. The subdomain of the current
// host picks the entry, so localhost, staging and production all resolve from
// the same file.

export interface SupportConfig {
  phone1: string
  phone2: string
  email: string
}

export interface RuntimeConfig {
  baseUrl: Record<string, string>[]
  serviceUrl: Record<string, string>
  /** Shown on the login screen — reseller/support desk contacts. */
  support: SupportConfig
  /** Path appended to the resolved base URL, e.g. "/api". */
  apiPath: string
  siteName: string
  /** Keep the in-browser mock store instead of calling the backend. */
  useMockApi: boolean
}

const FALLBACK: RuntimeConfig = {
  baseUrl: [{ localhost: '' }],
  serviceUrl: {},
  support: { phone1: '', phone2: '', email: '' },
  apiPath: '/api',
  siteName: 'GarageFlow',
  useMockApi: true,
}

let config: RuntimeConfig = { ...FALLBACK }

/** First label of the hostname — "demo.garageflow.com" → "demo". */
function subdomain(): string {
  const host = typeof window === 'undefined' ? 'localhost' : window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return 'localhost'
  return host.split('.')[0]
}

/**
 * Load config.json. Call once before rendering — everything after that reads it
 * synchronously, so no other module has to await anything.
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: 'no-store' })
    if (res.ok) config = { ...FALLBACK, ...(await res.json()) }
  } catch {
    // Missing or malformed config.json — stay on the mock store rather than
    // firing requests at an origin we cannot resolve.
    config = { ...FALLBACK }
  }

  // An env var still wins, so VITE_API_BASE keeps working for local overrides.
  const envBase = import.meta.env.VITE_API_BASE
  if (envBase) config = { ...config, baseUrl: [{ [subdomain()]: envBase }], apiPath: '', useMockApi: false }

  return config
}

export function getConfig(): RuntimeConfig {
  return config
}

/** Backend origin for the current host, falling back to the localhost entry. */
export function baseUrl(): string {
  const map = config.baseUrl?.[0] ?? {}
  return map[subdomain()] ?? map.localhost ?? ''
}

/** Full API root — resolved base URL + `apiPath`. */
export function apiBase(): string {
  return `${baseUrl()}${config.apiPath}`
}

/** Auxiliary services (printing, SMS…) from the `serviceUrl` block. */
export function serviceUrl(name: string): string {
  return config.serviceUrl?.[name] ?? ''
}

/** Support desk contacts for the login screen. */
export function support(): SupportConfig {
  return config.support ?? FALLBACK.support
}
