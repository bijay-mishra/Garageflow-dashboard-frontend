import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Spinner } from '../loaders/States'

export interface Option {
  label: string
  value: string | number
  /** Second line under the label — plate, phone, code… */
  detail?: string
}

interface DropdownProps {
  options?: Option[]
  /** Async source — called with the typed term. Use for API-backed lists. */
  loadOptions?: (term: string) => Promise<Option[]>
  value: string | number | null | undefined
  onChange: (value: string | number | null, option: Option | null) => void
  label?: string
  placeholder?: string
  name?: string
  isRequired?: boolean
  isClearable?: boolean
  isSearchable?: boolean
  isLoading?: boolean
  disabled?: boolean
  /** Read-only display of the selected label. */
  isView?: boolean
  error?: string
  className?: string
}

/**
 * Single-select dropdown with type-ahead. Pass `options` for a static list, or
 * `loadOptions` to fetch them (debounced, cached per term) — the API-driven
 * variant of the same control.
 */
export default function Dropdown({
  options,
  loadOptions,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  name,
  isRequired = false,
  isClearable = true,
  isSearchable = true,
  isLoading = false,
  disabled = false,
  isView = false,
  error,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [remote, setRemote] = useState<Option[]>([])
  const [fetching, setFetching] = useState(false)
  const [cursor, setCursor] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const source = loadOptions ? remote : options ?? []

  const shown = useMemo(() => {
    if (loadOptions) return source // the server already filtered
    const q = term.trim().toLowerCase()
    if (!q) return source
    return source.filter((o) => o.label.toLowerCase().includes(q) || o.detail?.toLowerCase().includes(q))
  }, [source, term, loadOptions])

  const selected = useMemo(
    () => (options ?? remote).find((o) => o.value === value) ?? null,
    [options, remote, value],
  )

  // Debounced fetch for the async variant.
  useEffect(() => {
    if (!loadOptions || !open) return
    setFetching(true)
    const id = setTimeout(() => {
      loadOptions(term)
        .then(setRemote)
        .catch(() => setRemote([]))
        .finally(() => setFetching(false))
    }, 250)
    return () => clearTimeout(id)
  }, [term, open, loadOptions])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
        setTerm('')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => setCursor(0), [term, open])

  const pick = (opt: Option) => {
    onChange(opt.value, opt)
    setOpen(false)
    setTerm('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return setOpen(false)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) return setOpen(true)
      const step = e.key === 'ArrowDown' ? 1 : -1
      setCursor((c) => (shown.length ? (c + step + shown.length) % shown.length : 0))
    } else if (e.key === 'Enter' && open && shown[cursor]) {
      e.preventDefault()
      pick(shown[cursor])
    }
  }

  if (isView) {
    return (
      <div className={className}>
        {label && <span className="mb-1 block text-xs font-semibold text-ink-600">{label}</span>}
        <p className="text-sm text-ink-900">{selected?.label ?? '—'}</p>
      </div>
    )
  }

  const busy = isLoading || fetching

  return (
    <div className={clsx('relative', className)} ref={boxRef}>
      {label && (
        <span className="mb-1 block text-xs font-semibold text-ink-600">
          {label}
          {isRequired && <span className="ml-0.5 text-rose-500">*</span>}
        </span>
      )}

      <button
        type="button"
        name={name}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          setOpen((o) => !o)
          if (isSearchable) setTimeout(() => inputRef.current?.focus(), 0)
        }}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={clsx(
          'flex h-9 w-full items-center gap-2 rounded-md border bg-white px-3 text-left text-sm outline-none transition',
          'disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
          error ? 'border-rose-300 focus:ring-4 focus:ring-rose-100' : 'border-ink-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
        )}
      >
        <span className={clsx('min-w-0 flex-1 truncate', selected ? 'text-ink-900' : 'text-ink-400')}>
          {selected?.label ?? placeholder}
        </span>
        {busy && <Spinner className="h-3.5 w-3.5 text-brand-500" />}
        {isClearable && selected && !disabled && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null, null)
            }}
            className="rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-ink-400" />
      </button>

      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}

      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-ink-100 bg-white shadow-soft animate-fade-in">
          {isSearchable && (
            <div className="border-b border-ink-100 p-1.5">
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search…"
                className="h-8 w-full rounded-lg border border-ink-200 px-2.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
          )}

          <ul role="listbox" className="max-h-56 overflow-y-auto p-1">
            {busy && shown.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-ink-400">Loading…</li>
            ) : shown.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-ink-400">No options</li>
            ) : (
              shown.map((o, i) => {
                const active = i === cursor
                const chosen = o.value === value
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={chosen}
                      onMouseEnter={() => setCursor(i)}
                      onClick={() => pick(o)}
                      className={clsx(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition',
                        active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{o.label}</span>
                        {o.detail && <span className="block truncate text-xs text-ink-400">{o.detail}</span>}
                      </span>
                      {chosen && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
