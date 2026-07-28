import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export default function Panel({ title, subtitle, action, children, className = '', bodyClassName = '' }: PanelProps) {
  return (
    <section className={`card animate-fade-in ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-ink-900">{title}</h3>
          {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={bodyClassName || 'p-4'}>{children}</div>
    </section>
  )
}
