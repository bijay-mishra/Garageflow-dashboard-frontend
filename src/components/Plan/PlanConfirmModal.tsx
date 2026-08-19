import { ArrowRightIcon, CheckIcon, MinusIcon } from '@heroicons/react/24/outline'
import { MODULE_LABELS, type ModuleName } from '@/context/ModuleContext'
import { formatRs } from '@/lib/format'
import type { IWorkshopPlan } from './plan-query'

interface PlanConfirmModalProps {
  plan: IWorkshopPlan
  /** The tier the company is on now, for the before/after. */
  current: IWorkshopPlan | null
  months: 1 | 12
  provider: string
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * The last screen before the money leaves.
 *
 * Upgrading used to redirect straight to eSewa on one click, which is the wrong
 * shape for a payment: the amount was decided by a toggle at the top of the
 * page, and the next thing you saw was somebody else's site asking for a PIN.
 *
 * So this states the three things worth being sure of — what it costs, for how
 * long, and what actually changes — and names the wallet on the button, because
 * "Confirm" gives no warning that the next tap leaves the app.
 */
export default function PlanConfirmModal({
  plan,
  current,
  months,
  provider,
  busy,
  onClose,
  onConfirm,
}: PlanConfirmModalProps) {
  const price = months === 1 ? plan.monthlyPrice : plan.yearlyPrice

  const had = new Set(current?.modules ?? [])
  const gets = new Set(plan.modules)

  // Shown separately rather than as one list of ticks. A downgrade that quietly
  // removes multi-branch is exactly the change somebody needs to see before
  // paying, not after.
  const gaining = plan.modules.filter((m) => !had.has(m))
  const losing = (current?.modules ?? []).filter((m) => !gets.has(m))

  const label = (m: string) => MODULE_LABELS[m as ModuleName] ?? m

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-ink-100 bg-white shadow-xl">
        <div className="border-b border-ink-100 px-5 py-4">
          <p className="text-sm font-bold text-ink-900">Confirm your plan</p>
          <p className="mt-0.5 text-xs text-ink-500">
            You will be taken to {provider} to pay. Nothing changes until the payment completes.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* What is being bought, and what it replaces. */}
          <div className="flex items-center gap-3">
            {current && (
              <>
                <span className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
                  {current.name}
                </span>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-400" />
              </>
            )}
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
              {plan.name}
            </span>
          </div>

          <div className="rounded-lg bg-ink-50 px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-ink-500">
                {months === 1 ? 'One month' : 'One year'}
              </span>
              <span className="text-xl font-bold tracking-tight text-ink-900">
                {formatRs(price)}
              </span>
            </div>

            {months === 12 && (
              <p className="mt-1 text-right text-xs text-emerald-600">
                Two months free — {formatRs(plan.monthlyPrice)}/month billed annually
              </p>
            )}
          </div>

          {gaining.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-500">You get</p>
              <ul className="space-y-1">
                {gaining.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-ink-700">
                    <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                    {label(m)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {losing.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-rose-600">You lose access to</p>
              <ul className="space-y-1">
                {losing.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-sm text-ink-500">
                    <MinusIcon className="h-4 w-4 shrink-0 text-rose-400" />
                    {label(m)}
                  </li>
                ))}
              </ul>
              {/* Said plainly because it is the one thing people assume goes. */}
              <p className="mt-2 text-xs text-ink-400">
                Your records are not deleted — anything above the new plan becomes read-only.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3">
          <button type="button" className="btn-ghost text-xs" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-primary text-xs" onClick={onConfirm} disabled={busy}>
            {busy ? 'Starting…' : `Pay ${formatRs(price)} with ${provider}`}
          </button>
        </div>
      </div>
    </div>
  )
}
