import { useId } from 'react'
import clsx from 'clsx'

/**
 * Inline SVG flags. Emoji flags (🇬🇧 / 🇳🇵) don't render on Windows — Segoe UI
 * falls back to the "GB" / "NP" letter pair — so the language switcher draws
 * them as vectors instead.
 *
 * Pass a height class (`h-5`); each flag supplies its own width so the real
 * aspect ratio is kept (the UK is 2:1, Nepal is taller than it is wide).
 */
export type FlagCode = 'gb' | 'np'

interface FlagProps {
  code: FlagCode
  className?: string
  title?: string
}

export default function Flag({ code, className = 'h-5', title }: FlagProps) {
  return code === 'np' ? <NepalFlag className={className} title={title} /> : <UkFlag className={className} title={title} />
}

function UkFlag({ className, title }: { className?: string; title?: string }) {
  const id = useId()
  return (
    <svg
      viewBox="0 0 60 30"
      className={clsx('w-7 shrink-0 overflow-hidden rounded-[3px]', className)}
      role="img"
      aria-label={title ?? 'English'}
    >
      {title && <title>{title}</title>}
      <clipPath id={id}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id})`} stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  )
}

/** Nepal's double pennon — crimson field, blue border, white moon and sun. */
function NepalFlag({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 84 108" className={clsx('w-4 shrink-0', className)} role="img" aria-label={title ?? 'नेपाली'}>
      {title && <title>{title}</title>}
      <path d="M6 6 L64 42 H34 L76 72 L6 102 Z" fill="#DC143C" stroke="#003893" strokeWidth="9" strokeLinejoin="round" />
      {/* Moon */}
      <g fill="#fff">
        <path d="M20 15 l3 5 5-2 -2 5 5 3 -5 3 2 5 -5-2 -3 5 -3-5 -5 2 2-5 -5-3 5-3 -2-5 5 2z" />
        <path d="M26 22a7.5 7.5 0 1 1-9-7 6 6 0 0 0 9 7z" />
      </g>
      {/* Sun */}
      <g fill="#fff">
        <path d="M24 51 l3.5 6 6.5-3 -3 6.5 6 3.5 -6 3.5 3 6.5 -6.5-3 -3.5 6 -3.5-6 -6.5 3 3-6.5 -6-3.5 6-3.5 -3-6.5 6.5 3z" />
        <circle cx="24" cy="64" r="6.5" />
      </g>
    </svg>
  )
}
