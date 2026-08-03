import { useState } from 'react'
import clsx from 'clsx'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import { useGetCompanies, useGetModules } from '@/components/SuperAdmin/superadmin-query'
import ModulesTab from '@/components/SuperAdmin/config/ModulesTab'
import MenusTab from '@/components/SuperAdmin/config/MenusTab'
import CompanyScopedTab from '@/components/SuperAdmin/config/CompanyScopedTab'
import FiscalYearPanel from '@/components/Configuration/FiscalYearPanel'
import BranchPanel from '@/components/Configuration/BranchPanel'
import ThresholdsTab from '@/components/SuperAdmin/config/ThresholdsTab'

type TabId = 'modules' | 'menus' | 'fiscal' | 'branches' | 'thresholds'

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'modules', label: 'Modules', blurb: 'What the product offers, and who has each part' },
  { id: 'menus', label: 'Menus', blurb: 'The sidebar every company draws from' },
  { id: 'fiscal', label: 'Fiscal year', blurb: 'The Nepali accounting year the platform runs on' },
  { id: 'branches', label: 'Branches', blurb: 'How many locations each company runs' },
  { id: 'thresholds', label: 'Thresholds', blurb: 'The numbers the dashboard calls "overdue"' },
]

/**
 * Everything about the platform that is not about one company.
 *
 * Tabbed rather than one long page: these are five unrelated subjects that
 * happen to share an audience, and stacking them meant scrolling past four to
 * reach the fifth. Which company has which module is still edited on that
 * company's page — this is the view across all of them.
 */
export default function Configuration() {
  const [tab, setTab] = useState<TabId>('modules')

  // Which company the company-scoped tabs act on. Held here rather than inside
  // each tab so switching between Fiscal years and Branches keeps your place.
  const [company, setCompany] = useState('')

  const { data: modules = [], isLoading, isError } = useGetModules()
  const { data: companies = [] } = useGetCompanies()

  if (isLoading) return <LoadingBlock label="Loading configuration…" />
  if (isError) return <ErrorBlock />

  const active = TABS.find((t) => t.id === tab)!

  return (
    <>
      <ConsoleHeader title="Configuration" subtitle={active.blurb} />

      <div className="border-b border-ink-200 bg-white px-5 lg:px-8">
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition',
                tab === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-500 hover:border-ink-200 hover:text-ink-800',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 p-5 lg:p-8">
        {tab === 'modules' && <ModulesTab modules={modules} companies={companies} />}
        {tab === 'menus' && <MenusTab modules={modules} />}
        {tab === 'fiscal' && (
          <CompanyScopedTab companies={companies} selected={company} onSelect={setCompany}>
            <FiscalYearPanel key={company} companyCode={company} />
          </CompanyScopedTab>
        )}
        {tab === 'branches' && (
          <CompanyScopedTab companies={companies} selected={company} onSelect={setCompany}>
            <BranchPanel key={company} companyCode={company} />
          </CompanyScopedTab>
        )}
        {tab === 'thresholds' && <ThresholdsTab />}
      </div>
    </>
  )
}
