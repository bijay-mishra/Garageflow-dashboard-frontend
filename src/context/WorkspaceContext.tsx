import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  useGetWorkspace,
  useSelectWorkspace,
  type IBranch,
  type IFiscalYear,
} from '@/components/Workshop/workspace-query'
import { useModules } from './ModuleContext'

// ── Active workspace ─────────────────────────────────────────────────────────
// Which branch and fiscal year the dashboard is looking at.
//
// This used to hold two localStorage strings chosen from a hardcoded list, and
// nothing else in the product ever read them — switching year re-rendered a
// label. The state now lives on the server, travels in the JWT and is changed
// through an endpoint that hands back a new token; see workspace-query.ts.
//
// What that buys, beyond the switch actually working: the choice follows the
// person rather than the browser. Signing in on the workshop's other machine
// opens the year you were last in, and clearing site data no longer silently
// puts you back in the current year without saying so.

interface WorkspaceCtx {
  branchId: string | null
  branch: IBranch | null
  setBranchId: (id: string) => void
  fiscalYear: string
  setFiscalYear: (year: string) => void
  branches: IBranch[]
  fiscalYears: IFiscalYear[]
  /** False while viewing a closed year — screens use it to label their figures. */
  isCurrentYear: boolean
  /** True while the switch is in flight, so the pickers can disable themselves. */
  switching: boolean
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceCtx | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { has } = useModules()
  const { data: workspace, isLoading } = useGetWorkspace()
  const select = useSelectWorkspace()

  const value = useMemo<WorkspaceCtx>(() => {
    const branches = workspace?.branches ?? []
    const fiscalYears = workspace?.fiscalYears ?? []

    return {
      branchId: workspace?.branchId ?? null,
      branch: branches.find((b) => b.id === workspace?.branchId) ?? branches[0] ?? null,
      branches,
      fiscalYears,
      fiscalYear: workspace?.fiscalYear ?? '',
      isCurrentYear: workspace?.isCurrentYear ?? true,
      switching: select.isPending,
      loading: isLoading,

      // Guarded here as well as in the picker. The picker's lock is what the
      // user sees; this is what stops a switch happening at all without the
      // module — a locked button is a UI state, not a rule.
      setBranchId: (id) => {
        if (!has('multiBranch')) return
        select.mutate({ branchId: id })
      },
      setFiscalYear: (year) => {
        if (!has('fiscalYear')) return
        select.mutate({ fiscalYear: year })
      },
    }
  }, [workspace, isLoading, select, has])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
