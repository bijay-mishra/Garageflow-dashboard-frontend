import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UsersIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import { useGetCustomerList } from '@/components/Customer/customer-query'
import { useGetVehicleList } from '@/components/Vehicle/vehicle-query'
import { useGetJobCardList } from '@/components/JobCard/jobcard-query'
import { useLang } from '@/context/LanguageContext'
import { flatNav, EXTRA_PAGES } from '@/lib/navigation'

interface Hit {
  key: string
  group: string
  label: string
  sub?: string
  icon: typeof UsersIcon
  to: string
}

const PER_GROUP = 4

export default function GlobalSearch() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Data is already cached by React Query — searching is a client-side filter.
  const { data: customers = [] } = useGetCustomerList()
  const { data: vehicles = [] } = useGetVehicleList()
  const { data: jobs = [] } = useGetJobCardList()

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const out: Hit[] = []

    // flatNav() already drops group parents, so every entry has a route.
    for (const p of [...flatNav(), ...EXTRA_PAGES]) {
      const to = p.to!
      const label = t(p.labelKey)
      if (label.toLowerCase().includes(term) || to.includes(term))
        out.push({ key: `page:${to}`, group: t('search.pages'), label, icon: p.icon, to })
    }

    for (const c of customers.slice(0, 400)) {
      if (c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.email.toLowerCase().includes(term))
        out.push({
          key: `cus:${c.id}`,
          group: t('search.customers'),
          label: c.name,
          sub: c.phone,
          icon: UsersIcon,
          to: `/customers?q=${encodeURIComponent(c.name)}`,
        })
    }

    for (const v of vehicles.slice(0, 400)) {
      if (
        v.plate.toLowerCase().includes(term) ||
        v.make.toLowerCase().includes(term) ||
        v.model.toLowerCase().includes(term) ||
        v.customerName.toLowerCase().includes(term)
      )
        out.push({
          key: `veh:${v.id}`,
          group: t('search.vehicles'),
          label: v.plate,
          sub: `${v.make} ${v.model} · ${v.customerName}`,
          icon: TruckIcon,
          to: `/vehicles?q=${encodeURIComponent(v.plate)}`,
        })
    }

    for (const j of jobs.slice(0, 400)) {
      if (
        j.id.toLowerCase().includes(term) ||
        j.vehiclePlate.toLowerCase().includes(term) ||
        j.vehicleLabel.toLowerCase().includes(term) ||
        j.customerName.toLowerCase().includes(term) ||
        j.mechanic.toLowerCase().includes(term)
      )
        out.push({
          key: `job:${j.id}`,
          group: t('search.jobCards'),
          label: j.id,
          sub: `${j.vehicleLabel} · ${j.status}`,
          icon: ClipboardDocumentListIcon,
          to: `/job-cards?q=${encodeURIComponent(j.id)}`,
        })
    }

    // Cap each group so one entity type can't flood the dropdown.
    const seen: Record<string, number> = {}
    return out.filter((h) => (seen[h.group] = (seen[h.group] ?? 0) + 1) <= PER_GROUP)
  }, [q, customers, vehicles, jobs, t])

  const groups = useMemo(() => {
    const map = new Map<string, Hit[]>()
    hits.forEach((h) => map.set(h.group, [...(map.get(h.group) ?? []), h]))
    return [...map.entries()]
  }, [hits])

  useEffect(() => setCursor(0), [q])

  // ⌘K / Ctrl+K focuses the box from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const goto = (hit: Hit) => {
    setOpen(false)
    setQ('')
    inputRef.current?.blur()
    navigate(hit.to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!hits.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (c + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      goto(hits[cursor])
    }
  }

  let index = -1

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className="h-10 w-full rounded-md border border-white/25 bg-white/15 pl-10 pr-16 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-white/60 hover:bg-white/20 focus:border-white/40 focus:bg-white/25 focus:ring-4 focus:ring-white/15"
        />
        {/* Rendered after the input: the field's translucent fill + backdrop-blur
            would otherwise paint straight over it. */}
        <MagnifyingGlassIcon
          strokeWidth={2}
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-white"
        />
        {q ? (
          <button
            onClick={() => {
              setQ('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded p-1 text-white/70 hover:bg-white/20 hover:text-white"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/30 px-1.5 py-0.5 text-[10px] font-semibold text-white/70 sm:block">
            Ctrl K
          </kbd>
        )}
      </div>

      {open && q.trim() !== '' && (
        <div className="absolute left-0 right-0 top-12 z-40 max-h-[70vh] overflow-y-auto rounded-lg border border-ink-100 bg-white p-1.5 shadow-soft animate-fade-in">
          {groups.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-400">{t('search.noResults')}</p>
          ) : (
            groups.map(([group, items]) => (
              <div key={group}>
                <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{group}</p>
                {items.map((hit) => {
                  index += 1
                  const active = index === cursor
                  const Icon = hit.icon
                  return (
                    <button
                      key={hit.key}
                      onMouseEnter={() => setCursor(hits.indexOf(hit))}
                      onClick={() => goto(hit)}
                      className={clsx(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition',
                        active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
                      )}
                    >
                      <Icon className={clsx('h-5 w-5 shrink-0', active ? 'text-brand-600' : 'text-ink-400')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{hit.label}</span>
                        {hit.sub && <span className="block truncate text-xs text-ink-400">{hit.sub}</span>}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
