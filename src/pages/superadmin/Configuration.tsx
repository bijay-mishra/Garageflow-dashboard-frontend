import { useState } from 'react'
import {
  AdjustmentsHorizontalIcon,
  ArrowLeftIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronRightIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import { useGetCompanies, useGetModules } from '@/components/SuperAdmin/superadmin-query'
import ModulesTab from '@/components/SuperAdmin/config/ModulesTab'
import MenusTab from '@/components/SuperAdmin/config/MenusTab'
import CompanyScopedTab from '@/components/SuperAdmin/config/CompanyScopedTab'
import FiscalYearPanel from '@/components/Configuration/FiscalYearPanel'
import BranchPanel from '@/components/Configuration/BranchPanel'
import ThresholdsTab from '@/components/SuperAdmin/config/ThresholdsTab'

type SectionId = 'modules' | 'menus' | 'fiscal' | 'branches' | 'thresholds'

type IconComponent = typeof Squares2X2Icon

const SECTIONS: {
  id: SectionId
  label: string
  blurb: string
  icon: IconComponent
}[] = [
  {
    id: 'modules',
    label: 'Modules',
    blurb: 'What the product offers, and who has each part',
    icon: Squares2X2Icon,
  },
  {
    id: 'menus',
    label: 'Menus',
    blurb: 'The sidebar every company draws from',
    icon: ListBulletIcon,
  },
  {
    id: 'fiscal',
    label: 'Fiscal year',
    blurb: 'The Nepali accounting year the platform runs on',
    icon: CalendarDaysIcon,
  },
  {
    id: 'branches',
    label: 'Branches',
    blurb: 'How many locations each company runs',
    icon: BuildingOffice2Icon,
  },
  {
    id: 'thresholds',
    label: 'Thresholds',
    blurb: 'The numbers the dashboard calls "overdue"',
    icon: AdjustmentsHorizontalIcon,
  },
]

/**
 * Everything about the platform that is not about one company.
 *
 * A list you step into rather than a row of tabs, which is what this was. Five
 * tabs fit across the top and then gave the module matrix and the menu editor a
 * strip of what was left — and those two are the widest things in the console.
 * Drilling in hands each panel the whole page, and the same gesture the
 * workshop's own Configuration screen uses, so the two consoles do not disagree
 * about what a settings page looks like.
 *
 * Which company has which module is still edited on that company's page; this
 * is the view across all of them.
 */
export default function Configuration() {
  const [section, setSection] = useState<SectionId | null>(null)

  // Which company the company-scoped sections act on. Held here rather than
  // inside each panel so stepping out of Fiscal year and into Branches keeps
  // your place instead of asking again.
  const [company, setCompany] = useState('')

  const { data: modules = [], isLoading, isError } = useGetModules()
  const { data: companies = [] } = useGetCompanies()

  if (isLoading) return <LoadingBlock label="Loading configuration…" />
  if (isError) return <ErrorBlock />

  const open = SECTIONS.find((s) => s.id === section)

  if (open) {
    return (
      <>
        <ConsoleHeader title={open.label} subtitle={open.blurb}>
          <button className="btn-ghost" onClick={() => setSection(null)}>
            <ArrowLeftIcon className="h-4 w-4" />
            All settings
          </button>
        </ConsoleHeader>

        <div className="space-y-6 p-5 lg:p-8">
          {open.id === 'modules' && <ModulesTab modules={modules} companies={companies} />}
          {open.id === 'menus' && <MenusTab modules={modules} />}
          {open.id === 'fiscal' && (
            <CompanyScopedTab companies={companies} selected={company} onSelect={setCompany}>
              <FiscalYearPanel key={company} companyCode={company} />
            </CompanyScopedTab>
          )}
          {open.id === 'branches' && (
            <CompanyScopedTab companies={companies} selected={company} onSelect={setCompany}>
              <BranchPanel key={company} companyCode={company} />
            </CompanyScopedTab>
          )}
          {open.id === 'thresholds' && <ThresholdsTab />}
        </div>
      </>
    )
  }

  return (
    <>
      <ConsoleHeader title="Configuration" subtitle="Platform settings, across every company" />

      <div className="p-5 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="card group flex items-start gap-3.5 px-5 py-4 text-left transition hover:border-brand-200 hover:shadow-soft"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 transition group-hover:bg-brand-100">
                <s.icon className="h-4 w-4 text-brand-600" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink-900">{s.label}</span>
                {/* The blurb earns its place here in a way it never did on a
                    tab: "Thresholds" and "Modules" are not self-explanatory, and
                    a tab strip has nowhere to say what they mean. */}
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                  {s.blurb}
                </span>
              </span>

              <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-brand-600" />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
