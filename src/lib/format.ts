// ── Formatting helpers ───────────────────────────────────────────────────────

/** Format a number as Rupees with Nepali/Indian digit grouping, e.g. 125000 -> "Rs 1,25,000". */
export function formatRs(amount: number, withDecimals = false): string {
  const rounded = withDecimals ? amount.toFixed(2) : Math.round(amount).toString()
  const [intPart, decPart] = rounded.split('.')
  const sign = intPart.startsWith('-') ? '-' : ''
  const digits = intPart.replace('-', '')

  let result = ''
  if (digits.length > 3) {
    const last3 = digits.slice(-3)
    const rest = digits.slice(0, -3)
    result = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
  } else {
    result = digits
  }
  return `Rs ${sign}${result}${decPart ? '.' + decPart : ''}`
}

/** Compact currency, e.g. 1250000 -> "Rs 12.50L". */
export function formatRsCompact(amount: number): string {
  if (amount >= 10000000) return `Rs ${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `Rs ${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `Rs ${(amount / 1000).toFixed(1)}K`
  return `Rs ${Math.round(amount)}`
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN')
}

/** e.g. "2026-07-12" -> "12 Jul 2026" */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** e.g. relative "2h ago" / "3d ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const s = Math.max(1, Math.floor((now - then) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

/** Today as an ISO day string ("YYYY-MM-DD") in local time. */
export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}
