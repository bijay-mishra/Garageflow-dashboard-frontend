import clsx from 'clsx'
import { initials } from '@/lib/format'

interface CompanyLogoProps {
  /** The stored logo, or null if the workshop has not uploaded one. */
  url?: string | null
  /** Used for the fallback initials and the alt text. */
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

/**
 * A company's mark, or its initials when it has none.
 *
 * Initials rather than a generic building icon: a list of forty companies where
 * every logo-less row shows the same grey glyph is a list you have to read word
 * by word. Initials at least differ, which is the whole job of the column.
 *
 * `object-contain` on a square, never `object-cover`. A logo is artwork with
 * deliberate margins, and cropping one to fill a circle cuts the ascenders off
 * somebody's wordmark.
 */
export default function CompanyLogo({ url, name, size = 'md', className }: CompanyLogoProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={clsx('shrink-0 rounded-lg bg-white object-contain', sizes[size], className)}
      />
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-lg bg-ink-100 font-bold uppercase text-ink-500',
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </span>
  )
}
