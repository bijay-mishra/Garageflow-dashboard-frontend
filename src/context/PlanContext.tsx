import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// ── Subscription plan & feature gate ─────────────────────────────────────────
// Which plan the workshop is on, and what that unlocks. Until billing is wired
// up the plan lives in localStorage, so upgrading from the Plans page takes
// effect immediately and the premium features are testable.

export type PlanId = 'starter' | 'pro' | 'business'

/** Everything that can be gated behind a paid plan. */
export type Feature = 'fiscalYear' | 'multiBranch' | 'sms' | 'onlineBooking'

export const PLAN_NAMES: Record<PlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

/** Cumulative — each plan includes everything below it. */
const PLAN_FEATURES: Record<PlanId, Feature[]> = {
  starter: [],
  pro: ['fiscalYear', 'sms', 'onlineBooking'],
  business: ['fiscalYear', 'sms', 'onlineBooking', 'multiBranch'],
}

/** The cheapest plan that includes a feature — used in upgrade prompts. */
const REQUIRED_PLAN: Record<Feature, PlanId> = {
  fiscalYear: 'pro',
  sms: 'pro',
  onlineBooking: 'pro',
  multiBranch: 'business',
}

interface PlanCtx {
  plan: PlanId
  setPlan: (plan: PlanId) => void
  /** Does the current plan include this feature? */
  can: (feature: Feature) => boolean
  /** Name of the plan a feature needs, e.g. "Business". */
  requiredPlanName: (feature: Feature) => string
}

const PlanContext = createContext<PlanCtx | undefined>(undefined)
const STORAGE_KEY = 'gf_plan'

function initialPlan(): PlanId {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'pro' || stored === 'business' || stored === 'starter' ? stored : 'starter'
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanId>(initialPlan)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, plan)
  }, [plan])

  const value = useMemo<PlanCtx>(
    () => ({
      plan,
      setPlan,
      can: (feature) => PLAN_FEATURES[plan].includes(feature),
      requiredPlanName: (feature) => PLAN_NAMES[REQUIRED_PLAN[feature]],
    }),
    [plan],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
