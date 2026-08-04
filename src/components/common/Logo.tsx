import { workshopInfo } from '@/data/seed'

/** Eight gear teeth, evenly spaced around the hub. */
const TEETH = [0, 45, 90, 135, 180, 225, 270, 315]

/**
 * The GarageFlow product logo. `mark` is the glyph on its own; `full` adds the
 * wordmark. `textClassName` hides the wordmark responsively — the collapsed rail
 * passes `lg:hidden` so the mobile drawer keeps it.
 *
 * This is fixed product identity and takes no props that could swap it out. An
 * earlier version accepted a workshop's own name and uploaded logo and rendered
 * those instead, which meant uploading a company logo silently replaced the
 * GarageFlow mark on every screen — the brand the whole interface, its colours
 * included, is built around.
 *
 * A tenant's logo belongs on the documents the tenant issues: the printed
 * invoice, which goes out under their name and not ours. It does not belong in
 * the application's own chrome. Keep it that way — if a caller ever needs a
 * company's mark, that is `CompanyLogo`, deliberately a separate component.
 */
export default function Logo({
  variant = 'full',
  className = '',
  textClassName = '',
}: {
  variant?: 'full' | 'mark'
  className?: string
  textClassName?: string
}) {
  if (variant === 'mark') return <Mark className={className || 'h-10 w-10'} />

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-10 w-10 shrink-0" />
      <span className={`min-w-0 leading-none ${textClassName}`}>
        <span className="block truncate text-base font-extrabold tracking-tight text-ink-900">
          Garage<span className="text-brand-600">Flow</span>
        </span>
        <span className="mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.12em] text-ink-400">
          {workshopInfo.tagline}
        </span>
      </span>
    </span>
  )
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="GarageFlow">
      <defs>
        <linearGradient id="gf-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>

      <rect width="48" height="48" rx="12" fill="url(#gf-logo)" />

      {/* Gear */}
      <g fill="#fff" opacity="0.95">
        {TEETH.map((angle) => (
          <rect key={angle} x="22.25" y="7" width="3.5" height="6" rx="1.2" transform={`rotate(${angle} 24 24)`} />
        ))}
      </g>
      <circle cx="24" cy="24" r="11" fill="none" stroke="#fff" strokeWidth="3" opacity="0.95" />

      {/* Wrench through the hub */}
      <path
        d="M28.6 17.8a5.4 5.4 0 0 0-7.1 6.7l-4.9 4.9a2 2 0 0 0 0 2.8l1.2 1.2a2 2 0 0 0 2.8 0l4.9-4.9a5.4 5.4 0 0 0 6.7-7.1l-3 3-2.8-.8-.8-2.8z"
        fill="#fff"
      />
    </svg>
  )
}
