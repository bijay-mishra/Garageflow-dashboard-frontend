import { useState } from 'react'
import StickyHeader from '@/components/common/headers/StickyHeader'
import FiscalYearPanel from '@/components/Configuration/FiscalYearPanel'
import BranchPanel from '@/components/Configuration/BranchPanel'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeftIcon, ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline'

type SectionId = 'fiscal' | 'branches'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'fiscal', label: 'Fiscal Year' },
  { id: 'branches', label: 'Branch' },
]

/**
 * The workshop's own lists: its accounting years and its locations.
 *
 * The same panels the operator console uses, pointed at your own company rather
 * than at one chosen from a list. Building them once was the point — an "admin"
 * copy of these forms is how two versions of the same rules drift until one
 * permits what the other refuses.
 */
export default function Configuration() {
  const { user } = useAuth()
  const [section, setSection] = useState<SectionId | null>(null)

  // The endpoints answer Owner and Manager only. Rendering the page for anyone
  // else would fill it with 403s under the words "Failed to load data", which is
  // not true — trying again cannot work.
  if (user?.role !== 'Owner' && user?.role !== 'Manager') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span className="rounded-xl bg-ink-100 p-3">
          <LockClosedIcon className="h-6 w-6 text-ink-400" />
        </span>
        <h1 className="mt-4 text-base font-bold text-ink-900">Configuration is for owners</h1>
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">
          Accounting years and branches are set by the workshop owner or a manager.
        </p>
      </div>
    )
  }

  const open = SECTIONS.find((s) => s.id === section)

  // Drilled into one entry: the list steps aside and the panel gets the page.
  if (open) {
    return (
      <div className="space-y-4">
        <StickyHeader title="Configuration">
          <button className="btn-ghost" onClick={() => setSection(null)}>
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
        </StickyHeader>

        {open.id === 'fiscal' && <FiscalYearPanel />}
        {open.id === 'branches' && <BranchPanel />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <StickyHeader title="Configuration" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className="card flex items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:border-brand-200 hover:shadow-soft"
          >
            <span className="truncate text-sm font-semibold text-brand-900">{s.label}</span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-900" />
          </button>
        ))}
      </div>
    </div>
  )
}
