import { useEffect, type ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xxl'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** ERP-style width preset. */
  size?: ModalSize
  /** Escape hatch — an explicit Tailwind max-w-* class wins over `size`. */
  maxWidth?: string
}

const sizes: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-lg',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xxl: 'max-w-7xl',
}

export default function Modal({ title, onClose, children, footer, size = 'sm', maxWidth }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full ${maxWidth ?? sizes[size]} flex-col overflow-hidden rounded-lg bg-white shadow-soft dark:bg-[#0f1626] animate-fade-in`}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h2 className="text-base font-bold text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}
