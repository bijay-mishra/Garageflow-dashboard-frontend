import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { branches, currentFiscalYear, fiscalYears, type Branch } from '@/data/seed'
import { usePlan } from './PlanContext'

// ── Active workspace ─────────────────────────────────────────────────────────
// Which branch and fiscal year the user is looking at. Both selections persist
// across reloads and are exposed here so queries can send them to the API.
// Without the matching plan the selection falls back to the defaults, so a
// downgrade can never leave someone stuck viewing another branch's data.

interface WorkspaceCtx {
  branchId: string
  branch: Branch
  setBranchId: (id: string) => void
  fiscalYear: string
  setFiscalYear: (year: string) => void
  branches: Branch[]
  fiscalYears: string[]
}

const WorkspaceContext = createContext<WorkspaceCtx | undefined>(undefined)
const BRANCH_KEY = 'gf_branch'
const FY_KEY = 'gf_fiscal_year'

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { can } = usePlan()
  const [storedBranch, setStoredBranch] = useState(() => localStorage.getItem(BRANCH_KEY) ?? branches[0].id)
  const [storedYear, setStoredYear] = useState(() => localStorage.getItem(FY_KEY) ?? currentFiscalYear)

  useEffect(() => {
    localStorage.setItem(BRANCH_KEY, storedBranch)
  }, [storedBranch])

  useEffect(() => {
    localStorage.setItem(FY_KEY, storedYear)
  }, [storedYear])

  const value = useMemo<WorkspaceCtx>(() => {
    // A plan without the feature always sees the default branch / current year.
    const branchId = can('multiBranch') ? storedBranch : branches[0].id
    const fiscalYear = can('fiscalYear') ? storedYear : currentFiscalYear
    return {
      branchId,
      branch: branches.find((b) => b.id === branchId) ?? branches[0],
      setBranchId: setStoredBranch,
      fiscalYear,
      setFiscalYear: setStoredYear,
      branches,
      fiscalYears,
    }
  }, [storedBranch, storedYear, can])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
