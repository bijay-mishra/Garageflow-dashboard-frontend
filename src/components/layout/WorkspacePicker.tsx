import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { useModules, MODULE_LABELS, type ModuleName } from '@/context/ModuleContext'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useDateFormat } from '@/hooks/useDateFormat'
import { fiscalYearLabel } from '@/lib/nepaliDate'
import { useLang } from '@/context/LanguageContext'

/**
 * Branch and fiscal-year selectors for the topbar.
 *
 * Both are optional modules. Without one the control is locked and clicking it
 * goes to /plans rather than silently doing nothing — a dead button teaches
 * people the topbar is unreliable, a locked one teaches them what they have
 * not got.
 */
export default function WorkspacePicker() {
  const { t } = useLang()
  const { date, lang } = useDateFormat()
  const {
    branch,
    branches,
    setBranchId,
    fiscalYear,
    fiscalYears,
    setFiscalYear,
    switching,
    loading,
  } = useWorkspace()

  // The selected year's own row, for its Gregorian window. Falls back to a
  // bare code: the session carries the code, and the list it came from can
  // still be loading behind it.
  const selected = fiscalYears.find((y) => y.code === fiscalYear) ?? { code: fiscalYear }

  return (
    <div className="mr-1 hidden items-center gap-1.5 xl:flex">
      <Picker
        module="multiBranch"
        label={t('workspace.branch')}
        icon={BuildingOffice2Icon}
        value={branch?.name ?? (loading ? '…' : 'No branches')}
        options={branches.map((b) => ({ value: b.id, label: b.name, detail: b.address }))}
        selected={branch?.id ?? ''}
        onSelect={setBranchId}
        busy={switching}
      />
      <Picker
        module="fiscalYear"
        label={t('workspace.fiscalYear')}
        icon={CalendarDaysIcon}
        // Nepali shows the BS code the books are kept in — "२०८२/८३". English
        // shows the Gregorian window that code covers — "2025/26" — because a
        // BS year number in Latin digits is not an English date, it is the same
        // date nobody asked to have transliterated.
        value={fiscalYear ? fiscalYearLabel(selected, lang) : loading ? '…' : '—'}
        options={fiscalYears.map((y) => ({
          value: y.code,
          label: fiscalYearLabel(y, lang),
          // The window the year actually covers, in whichever calendar is being
          // read — so the whole control speaks one language. A fiscal year does
          // not line up with either new year, and nobody should have to
          // remember where it starts.
          //
          // English carries the BS code as well, because that is the name on
          // the workshop's own paperwork and on anything the accountant sends
          // back. Reading the app in English does not stop the tax year being
          // called 2082/83.
          detail:
            (lang === 'en' ? `${y.code} BS · ` : '') +
            `${date(y.start)} – ${date(y.end)}` +
            (y.isCurrent ? ` · ${t('workspace.current')}` : ''),
        }))}
        selected={fiscalYear}
        onSelect={setFiscalYear}
        busy={switching}
        // A year code is a fixed, short string — it needs no reserved width.
        width="w-auto"
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
  module,
  label,
  icon: Icon,
  value,
  options,
  selected,
  onSelect,
  busy = false,
  width = 'w-44',
}: {
  module: ModuleName
  label: string
  icon: typeof BuildingOffice2Icon
  value: string
  options: Option[]
  selected: string
  onSelect: (value: string) => void
  /** A switch is in flight — the whole session is being reissued. */
  busy?: boolean
  width?: string
}) {
  const { has } = useModules()
  const { t } = useLang()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const unlocked = has(module)

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
    // Switching replaces the token and drops the whole cache. A second switch
    // mid-flight would race the first and could leave the session pointing
    // somewhere neither click asked for.
    if (busy) return
    setOpen((o) => !o)
  }

  return (
    <div className="relative" ref={boxRef}>
      {/* Glass, not a white card. Two solid white boxes sat on the blue bar as
          a second, competing surface — next to the flag, the bell and the
          avatar the right-hand cluster read as clutter. Tinted from the bar
          itself, they sit in the same layer as every other control up there. */}
      <button
        onClick={onClick}
        className={clsx(
          'flex h-10 items-center gap-2 rounded-lg border px-3 text-left backdrop-blur transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
          width,
          unlocked ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'cursor-pointer border-white/10 bg-white/5',
          open && 'border-white/40 bg-white/20',
        )}
        title={unlocked ? label : `${label} — ${t('workspace.requires')} ${MODULE_LABELS[module]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Icon className={clsx('h-4 w-4 shrink-0', unlocked ? 'text-white/80' : 'text-white/35')} />
        {/* One line, not a caption stacked over a value. The caption was 9px
            uppercase in a 126px box, so "FISCAL YEAR" wrapped and squeezed the
            year underneath it. The icon, the tooltip and the dropdown's own
            heading already say which selector this is — the button only has to
            say what is selected. */}
        <span
          className={clsx(
            // A step down from the company name on the left: these are the
            // session's settings, not the heading of the page.
            'min-w-0 flex-1 truncate text-xs font-semibold',
            unlocked ? 'text-white' : 'text-white/45',
          )}
        >
          {value}
        </span>
        {busy ? (
          <ArrowPathIcon className="h-3.5 w-3.5 shrink-0 animate-spin text-white" />
        ) : unlocked ? (
          <ChevronDownIcon className={clsx('h-3.5 w-3.5 shrink-0 text-white/60 transition', open && 'rotate-180')} />
        ) : (
          <LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-accent-300" />
        )}
      </button>

      {open && unlocked && (
        <div className="menu-panel right-0 top-full mt-2 w-64 p-1.5">
          <p className="menu-label">{label}</p>
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
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                    o.value === selected ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{o.label}</span>
                    {o.detail && <span className="mt-0.5 block truncate text-[10px] text-ink-400">{o.detail}</span>}
                  </span>
                  {o.value === selected && <CheckIcon className="h-4 w-4 shrink-0 text-brand-600" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
