import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastCtx {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastCtx | undefined>(undefined)

const ICONS = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  info: InformationCircleIcon,
}

const ACCENT = {
  success: 'text-brand-600',
  error: 'text-rose-500',
  info: 'text-accent-600',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++counter.current
      setToasts((t) => [...t, { id, type, message }])
      setTimeout(() => remove(id), 3200)
    },
    [remove],
  )

  const value: ToastCtx = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top-right, clear of the 4rem topbar. */}
      <div className="fixed right-4 top-[80px] z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-md border border-ink-100 bg-white px-4 py-3 shadow-soft animate-slide-in"
              role="status"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ACCENT[t.type]}`} />
              <p className="flex-1 text-sm font-medium text-ink-800">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
                className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
