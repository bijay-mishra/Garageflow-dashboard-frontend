import { apiBase, baseUrl, serviceUrl } from '@/lib/runtimeConfig'

// ── Endpoint resolution ──────────────────────────────────────────────────────
// ERP-Client's equivalent reads a synchronously-loaded config, so its `*-api.ts`
// files can bake a full URL into `controllerName` at import time:
//
//   const baseUrl = ApiEndPoints.baseUrl + "/api"      // ERP-Client
//
// GarageFlow fetches public/config.json *asynchronously* before the first
// render (see src/main.tsx). ES modules are evaluated before that fetch
// resolves, so anything read at import time would capture the empty fallback.
//
// So `controllerName` here is a path relative to the API root — `/customers`,
// `/job-cards/{id}` — and lib/api-schema.ts resolves the origin per request via
// `ApiEndPoints.baseUrl`. Same file layout as ERP-Client, correct against a
// config that is not there yet when the module loads.

export const ApiEndPoints = {
  /** Full API root for the current host, e.g. `http://localhost:5100/api`. */
  get baseUrl(): string {
    return apiBase()
  },

  /** Backend origin without the `/api` path — for non-API assets. */
  get origin(): string {
    return baseUrl()
  },

  /** Auxiliary services (printing, SMS…) from config.json's `serviceUrl` block. */
  service(name: string): string {
    return serviceUrl(name)
  },
} as const
