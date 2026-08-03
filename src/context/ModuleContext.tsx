import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useGetMyModules } from '@/components/Workshop/workspace-query'
import { useAuth } from './AuthContext'

// ── What this company has ────────────────────────────────────────────────────
// The set of modules the operator granted, read from the server.
//
// This replaces a plan id kept in localStorage. That version had the answer
// travelling with the browser rather than with the company: clearing site data
// restored every feature, and the Plans page could hand itself multi-branch by
// writing one string. It was a demo switch wearing the clothes of a licence.
//
// The list is now decided in the superadmin console and lives on the workshop
// row. What follows is the *menu*, not the lock — hiding a route stops honest
// mistakes and keeps the sidebar honest about what this workshop bought. The
// controllers behind each module still answer for themselves; a client that
// asks for deliveries it was not given is refused by the API, not by this file.

/** Every module the platform knows about. Mirrors Vocabulary.Modules on the API. */
export const MODULES = [
  'services',
  'billing',
  'deliveries',
  'reports',
  'staff',
  'serviceHistory',
  'multiBranch',
  'fiscalYear',
  'onlineBooking',
  'onlinePayment',
] as const

export type ModuleName = (typeof MODULES)[number]

/** What each one is called on screen, for locked-feature tooltips. */
export const MODULE_LABELS: Record<ModuleName, string> = {
  services: 'Price list',
  billing: 'Billing',
  deliveries: 'Pickup & delivery',
  reports: 'Reports',
  staff: 'Staff accounts',
  serviceHistory: 'Service history',
  multiBranch: 'Multiple branches',
  fiscalYear: 'Fiscal-year switching',
  onlineBooking: 'Online booking',
  onlinePayment: 'Online payment',
}

interface ModuleCtx {
  /** Has this company been given the module? */
  has: (module: ModuleName) => boolean
  /** Everything granted, in the order the platform lists them. */
  modules: ModuleName[]
  /** True until the first answer lands. */
  loading: boolean
}

const ModuleContext = createContext<ModuleCtx | undefined>(undefined)

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  // Not fetched for the operator: they are inside no company, so the endpoint
  // has nothing to answer with. Asking anyway would put a guaranteed failure in
  // the console's network log on every page.
  const inCompany = !!user && user.role !== 'SuperAdmin'

  const { data, isLoading } = useGetMyModules(inCompany)

  const value = useMemo<ModuleCtx>(() => {
    const granted = new Set(data ?? [])

    return {
      modules: MODULES.filter((m) => granted.has(m)),
      loading: inCompany && isLoading,

      // While the answer is still in flight nothing is hidden. The other
      // default — hide until proven granted — makes the sidebar flicker its
      // way in on every page load, which reads as a broken menu far more often
      // than it prevents anybody seeing a screen for half a second.
      has: (module) => (isLoading && inCompany ? true : granted.has(module)),
    }
  }, [data, isLoading, inCompany])

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModules() {
  const ctx = useContext(ModuleContext)
  if (!ctx) throw new Error('useModules must be used within ModuleProvider')
  return ctx
}
