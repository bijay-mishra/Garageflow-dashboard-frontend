// ── Static workshop configuration ────────────────────────────────────────────
// What used to be an in-browser mock database is now just the handful of values
// that have no API behind them yet. Customers, vehicles, job cards and invoices
// all come from the .NET backend — see the `*-query.ts` file in each feature
// folder under src/components.
//
// Everything here is a candidate for a future `/api/workshop` and
// `/api/branches` endpoint; until then it is deliberately hardcoded rather than
// faked through a mock layer.

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

/**
 * The tenant using the product. Static for now — a super-admin UI will create
 * and manage these, at which point it comes from the API.
 */
export const company = {
  id: 'CMP-001',
  name: 'Demo Company',
  shortName: 'Demo',
}

// ── Branches & fiscal years ──────────────────────────────────────────────────
// Multi-branch workshops switch between these from the topbar. Fiscal years are
// Nepali (BS) and run Shrawan → Ashadh, so 2083/84 is the current one.

export interface Branch {
  id: string
  name: string
  address: string
}

export const branches: Branch[] = [
  { id: 'BR-001', name: 'Main Branch', address: 'Ring Road, Kalanki' },
  { id: 'BR-002', name: 'Balaju Service Point', address: 'Balaju Bypass, Kathmandu' },
  { id: 'BR-003', name: 'Bhaktapur Workshop', address: 'Sallaghari, Bhaktapur' },
  { id: 'BR-004', name: 'Pokhara Branch', address: 'Lakeside, Pokhara' },
]

export const fiscalYears = ['2080/81', '2081/82', '2082/83', '2083/84']

export const currentFiscalYear = '2083/84'
