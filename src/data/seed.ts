// ── Static workshop configuration ────────────────────────────────────────────
// What used to be an in-browser mock database is now just the handful of values
// that have no API behind them yet. Customers, vehicles, job cards and invoices
// all come from the .NET backend — see the `*-query.ts` file in each feature
// folder under src/components.
//
// Everything here is a candidate for a future `/api/workshop` endpoint; until
// then it is deliberately hardcoded rather than faked through a mock layer.

export const workshopInfo = {
  name: 'GarageFlow',
  tagline: 'Auto Workshop Suite',
  legalName: 'Valley Auto Care Pvt. Ltd.',
  address: 'Ring Road, Kalanki, Kathmandu',
  phone: '+977 1-5234567',
  pan: '601234567',
  /** Default VAT rate applied to new invoices. */
  taxRate: 0.13,
}

// The tenant used to be a constant here — `company = { name: 'Demo Company' }` —
// read straight into the topbar. That shipped one name to every install: no
// screen could change it, because there was no record behind it to change.
//
// It is a real row the workshop owns now, from GET /api/workshop, edited on the
// Workshop settings screen. Removed rather than deprecated, so nothing can
// quietly go on reading it.

// ── Branches & fiscal years ──────────────────────────────────────────────────
// Both used to live here as hardcoded arrays, and the topbar's two dropdowns
// read them straight out of the bundle. That meant every install of this product
// claimed to have a Balaju, Bhaktapur and Pokhara branch, and offered a fixed
// list of four years that would have gone stale on its own in 2084.
//
// Branches are now real records the workshop owns, and fiscal years are computed
// from the calendar. Both come from `GET /api/workspace`; the selection is a
// session fact carried in the JWT and changed through `/auth/select-workspace`.
//
// See src/components/Workshop/workspace-query.ts.
