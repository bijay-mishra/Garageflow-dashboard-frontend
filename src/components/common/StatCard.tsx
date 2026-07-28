import clsx from 'clsx'
import type { ComponentType } from 'react'
import { ArrowUpRightIcon, ArrowDownRightIcon } from '@heroicons/react/24/solid'

type Tone = 'brand' | 'accent' | 'emerald' | 'violet' | 'rose'

interface StatCardProps {
  label: string
  value: string
  /** Signed percentage change. Always name the period it compares against. */
  delta?: number
  deltaPeriod?: string
  /** Small print under the tile — context, not a second metric. */
  footnote?: string
  icon: ComponentType<{ className?: string }>
  tone?: Tone
  /** Sparkline series, oldest → newest. */
  trend?: number[]
  /** A ratio against a limit, shown as a meter instead of a trend. */
  meter?: { value: number; max: number; caption: string }
}

const iconTone: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-accent-50 text-accent-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600',
}

/** Accent used for the live end of a trend and the meter fill. */
const accentTone: Record<Tone, string> = {
  brand: 'text-brand-500',
  accent: 'text-accent-500',
  emerald: 'text-emerald-500',
  violet: 'text-violet-500',
  rose: 'text-rose-500',
}

const trackTone: Record<Tone, string> = {
  brand: 'bg-brand-100',
  accent: 'bg-accent-100',
  emerald: 'bg-emerald-100',
  violet: 'bg-violet-100',
  rose: 'bg-rose-100',
}

export default function StatCard({
  label,
  value,
  delta,
  deltaPeriod = 'last month',
  footnote,
  icon: Icon,
  tone = 'brand',
  trend,
  meter,
}: StatCardProps) {
  const positive = (delta ?? 0) >= 0

  return (
    <div className="card card-hover flex flex-col p-4 animate-fade-in">
      {/* Label row — the icon sits with the label, not alone in dead space. */}
      <div className="flex items-center gap-2.5">
        <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', iconTone[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-500">{label}</span>
      </div>

      {/* Value + delta */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-2xl font-bold leading-none tracking-tight text-ink-900">{value}</span>
        {delta !== undefined && (
          <span
            className={clsx(
              'inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold',
              positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600',
            )}
          >
            {positive ? <ArrowUpRightIcon className="h-3 w-3" /> : <ArrowDownRightIcon className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      {delta !== undefined && <p className="mt-1 text-xs text-ink-400">vs {deltaPeriod}</p>}

      {/* Trend or meter fills the lower half so every tile carries the same weight. */}
      {trend && trend.length > 1 && <Sparkline values={trend} className={clsx('mt-3 h-8 w-full', accentTone[tone])} />}

      {meter && (
        <div className="mt-3">
          <div className={clsx('h-1.5 w-full overflow-hidden rounded-full', trackTone[tone])}>
            <div
              className={clsx('h-full rounded-full bg-current', accentTone[tone])}
              style={{ width: `${Math.min(100, Math.max(0, (meter.value / (meter.max || 1)) * 100))}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-400">{meter.caption}</p>
        </div>
      )}

      {footnote && <p className={clsx('text-xs text-ink-400', trend || meter ? 'mt-1.5' : 'mt-3')}>{footnote}</p>}
    </div>
  )
}

/**
 * Sparkline: the series in the de-emphasis grey with the most recent step in the
 * tile's accent. Drawn as two paths rather than a line plus an end dot — the SVG
 * is stretched horizontally, which would squash a circle into an ellipse.
 */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const W = 100
  const H = 30
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - 3 - ((v - min) / span) * (H - 6)
    return [x, y] as const
  })

  const toPath = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden focusable="false">
      <path
        d={toPath(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="text-ink-300"
      />
      <path
        d={toPath(points.slice(-2))}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
