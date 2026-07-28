import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { BuildingOffice2Icon, CalendarDaysIcon, ChevronDownIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { usePlan, type Feature } from '@/context/PlanContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useLang } from '@/context/LanguageContext'

/**
 * Branch and fiscal-year selectors for the topbar. Both are premium: on a plan
 * without the feature the control is locked and clicking it goes to /plans
 * rather than silently doing nothing.
 */
export default function WorkspacePicker() {
  const { t } = useLang()
  const { branch, branches, setBranchId, fiscalYear, fiscalYears, setFiscalYear } = useWorkspace()

  return (
    <div className="hidden items-center gap-2 xl:flex">
      <Picker
        feature="multiBranch"
        label={t('workspace.branch')}
        icon={BuildingOffice2Icon}
        value={branch.name}
        options={branches.map((b) => ({ value: b.id, label: b.name, detail: b.address }))}
        selected={branch.id}
        onSelect={setBranchId}
      />
      <Picker
        feature="fiscalYear"
        label={t('workspace.fiscalYear')}
        icon={CalendarDaysIcon}
        value={fiscalYear}
        options={fiscalYears.map((y) => ({ value: y, label: y }))}
        selected={fiscalYear}
        onSelect={setFiscalYear}
        width="w-32"
      />
    </div>
  )
}

interface Option {
  value: string
  label: string
  detail?: string
}

function Picker({
  feature,
  label,
  icon: Icon,
  value,
  options,
  selected,
  onSelect,
  width = 'w-48',
}: {
  feature: Feature
  label: string
  icon: typeof BuildingOffice2Icon
  value: string
  options: Option[]
  selected: string
  onSelect: (value: string) => void
  width?: string
}) {
  const { can, requiredPlanName } = usePlan()
  const { t } = useLang()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const unlocked = can(feature)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const onClick = () => {
    if (!unlocked) {
      navigate('/plans')
      return
    }
    setOpen((o) => !o)
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={onClick}
        className={clsx(
          'flex h-9 items-center gap-2 rounded-md border bg-white px-2.5 text-left transition',
          width,
          unlocked ? 'border-white/30 hover:bg-ink-50' : 'cursor-pointer border-white/20 bg-white/70',
        )}
        title={unlocked ? label : `${label} — ${t('workspace.requires')} ${requiredPlanName(feature)}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon className={clsx('h-4 w-4 shrink-0', unlocked ? 'text-brand-600' : 'text-ink-300')} />
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-semibold uppercase leading-none tracking-wider text-ink-400">{label}</span>
          <span className={clsx('block truncate text-xs font-semibold leading-tight', unlocked ? 'text-ink-800' : 'text-ink-400')}>
            {value}
          </span>
        </span>
        {unlocked ? (
          <ChevronDownIcon className={clsx('h-3.5 w-3.5 shrink-0 text-ink-400 transition', open && 'rotate-180')} />
        ) : (
          <LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-accent-500" />
        )}
      </button>

      {open && unlocked && (
        <div className="absolute right-0 z-40 mt-1 w-60 overflow-hidden rounded-md border border-ink-100 bg-white p-1 shadow-soft animate-fade-in">
          <ul role="listbox" className="max-h-72 overflow-y-auto">
            {options.map((o) => (
              <li key={o.value}>
                <button
                  role="option"
                  aria-selected={o.value === selected}
                  onClick={() => {
                    onSelect(o.value)
                    setOpen(false)
                  }}
                  className={clsx(
                    'w-full rounded px-2.5 py-2 text-left transition',
                    o.value === selected ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
                  )}
                >
                  <span className="block truncate text-xs font-semibold">{o.label}</span>
                  {o.detail && <span className="block truncate text-[10px] text-ink-400">{o.detail}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
