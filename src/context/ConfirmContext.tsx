import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = (result: boolean) => {
    resolver.current?.(result)
    resolver.current = null
    setOpts(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="alertdialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg bg-white p-6 shadow-soft animate-fade-in dark:bg-[#0f1626]">
            <div className={`flex h-11 w-11 items-center justify-center rounded-md ${opts.danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'}`}>
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-ink-900">{opts.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{opts.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => close(false)} className="btn-ghost">
                {opts.cancelLabel ?? 'Cancel'}
              </button>
              <button onClick={() => close(true)} className={opts.danger ? 'btn-danger' : 'btn-primary'}>
                {opts.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
