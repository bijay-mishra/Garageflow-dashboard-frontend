import clsx from 'clsx'
import type { ReactNode } from 'react'

export type BadgeTone = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'violet' | 'cyan' | 'emerald'

const tones: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-brand-50 text-brand-700',
  amber: 'bg-accent-50 text-accent-700',
  red: 'bg-rose-50 text-rose-700',
  gray: 'bg-ink-100 text-ink-600',
  violet: 'bg-violet-50 text-violet-700',
  cyan: 'bg-cyan-50 text-cyan-700',
}

const dotTones: Record<BadgeTone, string> = {
  green: 'bg-emerald-500',
  emerald: 'bg-emerald-500',
  blue: 'bg-brand-500',
  amber: 'bg-accent-500',
  red: 'bg-rose-500',
  gray: 'bg-ink-400',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  dot?: boolean
}

export default function Badge({ tone = 'gray', children, dot = false }: BadgeProps) {
  return (
    <span className={clsx('chip', tones[tone])}>
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', dotTones[tone])} />}
      {children}
    </span>
  )
}
