import { useEffect, useMemo, useState } from 'react'
import { CheckIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import StickyHeader from '@/components/common/headers/StickyHeader'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { MODULE_LABELS, type ModuleName } from '@/context/ModuleContext'
import PlanConfirmModal from '@/components/Plan/PlanConfirmModal'
import {
  useGetWorkshopPlans,
  useSubscribeWorkshop,
  useVerifyWorkshopPlan,
  type IWorkshopPlan,
} from '@/components/Plan/plan-query'
import { formatRs } from '@/lib/format'

type Billing = 'monthly' | 'yearly'

/**
 * Sales copy, keyed by the plan code the server sends.
 *
 * The split is deliberate: the server owns everything chargeable — the codes,
 * the prices and which modules a tier grants — and this file owns the wording.
 * The old page owned all of it, prices included, and "upgrade" wrote a plan id
 * to localStorage, which handed multi-branch to anyone who opened DevTools.
 *
 * A code with no entry here still renders; it shows its modules and no blurb,
 * which is the right failure for a tier added on the server first.
 */
const COPY: Record<string, { blurb: string; popular?: boolean }> = {
  starter: { blurb: 'For a single bay getting off paper.' },
  pro: { blurb: 'For a busy workshop with a full team.', popular: true },
  business: { blurb: 'For several branches under one roof.' },
}

/** Where a started payment is remembered while the browser is away paying. */
const PENDING_KEY = 'gf_plan_reference'

export default function Plans() {
  const [billing, setBilling] = useState<Billing>('monthly')
  const [confirming, setConfirming] = useState<IWorkshopPlan | null>(null)
  const toast = useToast()
  const { user } = useAuth()

  const { data, isLoading, isError } = useGetWorkshopPlans()
  const subscribe = useSubscribeWorkshop()
  const verify = useVerifyWorkshopPlan()

  // Only these two can commit the shop to a bill; the API refuses anyone else,
  // and a button that always 403s is worse than no button.
  const canBuy = user?.role === 'Owner' || user?.role === 'Manager'

  /**
   * Settles a payment the buyer has come back from.
   *
   * eSewa returns the browser to a page of the API's, not to this app, so there
   * is no redirect to catch. What there is instead is the tab regaining focus,
   * which is the moment worth asking the server what happened.
   */
  useEffect(() => {
    const settle = () => {
      const reference = sessionStorage.getItem(PENDING_KEY)
      if (!reference || verify.isPending) return

      verify.mutate(
        { reference },
        {
          // Cleared only once the answer is final. A payment still pending —
          // they are mid-flow in another tab — must survive to be asked about
          // again rather than being forgotten on the first glance back.
          onSuccess: (res) => {
            if (res?.data?.data?.settled) sessionStorage.removeItem(PENDING_KEY)
          },
        },
      )
    }

    settle()
    window.addEventListener('focus', settle)
    return () => window.removeEventListener('focus', settle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const months = billing === 'monthly' ? 1 : 12

  const current = useMemo(
    () => data?.items.find((p) => p.code === data.currentCode) ?? null,
    [data],
  )

  /** Every module any tier offers, in the order the richest tier lists them. */
  const allModules = useMemo(() => {
    if (!data) return []

    const widest = data.items.reduce<string[]>(
      (best, p) => (p.modules.length > best.length ? p.modules : best),
      [],
    )

    const seen = new Set(widest)
    const extras = data.items.flatMap((p) => p.modules).filter((m) => !seen.has(m))

    return [...widest, ...new Set(extras)]
  }, [data])

  if (isLoading) return <LoadingBlock label="Loading plans…" />
  if (isError || !data) return <ErrorBlock />

  const priceOf = (plan: IWorkshopPlan) =>
    billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

  const start = () => {
    const plan = confirming
    const provider = data.providers[0]

    if (!plan) return

    if (!provider) {
      toast.error('No payment provider is set up yet.')
      return
    }

    subscribe.mutate(
      { code: plan.code, months, provider },
      {
        onSuccess: (res) => {
          const checkout = res?.data?.data
          if (!checkout) return

          // Remembered before leaving, because this tab is about to be replaced
          // by the wallet's page and the reference is the only way back to the
          // attempt afterwards.
          sessionStorage.setItem(PENDING_KEY, checkout.reference)
          window.location.href = checkout.url
        },
      },
    )
  }

  const label = (m: string) => MODULE_LABELS[m as ModuleName] ?? m
  const buyingOff = data.providers.length === 0

  return (
    <div className="space-y-6">
      <StickyHeader title="Plans" subtitle="What your workshop pays for GarageFlow">
        <BillingToggle value={billing} onChange={setBilling} />
      </StickyHeader>

      {/* Where you stand, before what you could buy. Somebody opening this page
          is usually asking "what am I on?" before "what else is there?". */}
      <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
            <SparklesIcon className="h-5 w-5 text-brand-600" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">
              You are on {current?.name ?? 'no plan'}
            </p>
            <p className="text-xs text-ink-500">
              {data.expiresAt
                ? `Renews ${new Date(data.expiresAt).toLocaleDateString()}`
                : current && current.monthlyPrice === 0
                  ? 'Free forever — upgrade whenever you need more'
                  : 'No renewal date on record'}
            </p>
          </div>
        </div>

        <p className="text-xs text-ink-400">
          {current ? `${current.modules.length} of ${allModules.length} features included` : ''}
        </p>
      </section>

      {buyingOff && (
        <p className="rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-700">
          No payment provider is configured, so plans cannot be bought here yet. Contact GarageFlow
          support to change your plan.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {data.items.map((plan) => {
          const copy = COPY[plan.code]
          const isCurrent = plan.code === data.currentCode
          const free = plan.monthlyPrice === 0
          const missing = allModules.filter((m) => !plan.modules.includes(m))

          return (
            <section
              key={plan.code}
              className={clsx(
                'card relative flex flex-col p-5 animate-fade-in',
                copy?.popular && !isCurrent && 'ring-2 ring-brand-500',
                isCurrent && 'ring-2 ring-emerald-500',
              )}
            >
              {(copy?.popular || isCurrent) && (
                <span
                  className={clsx(
                    'absolute -top-2.5 left-5 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white',
                    isCurrent ? 'bg-emerald-500' : 'bg-brand-600',
                  )}
                >
                  {isCurrent ? 'Your plan' : 'Most popular'}
                </span>
              )}

              <h2 className="mt-1 text-base font-bold text-ink-900">{plan.name}</h2>
              {copy && <p className="mt-0.5 text-xs text-ink-500">{copy.blurb}</p>}

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-ink-900">
                  {free ? 'Free' : formatRs(priceOf(plan))}
                </span>
                {!free && (
                  <span className="text-xs text-ink-400">
                    /{billing === 'monthly' ? 'month' : 'year'}
                  </span>
                )}
              </div>

              <p className="mt-1 min-h-[1rem] text-xs text-emerald-600">
                {!free && billing === 'yearly' ? 'Two months free' : ''}
              </p>

              {/* Straight from the server, so this list is exactly what the
                  payment grants rather than a description that can drift. */}
              <ul className="mt-4 flex-1 space-y-2">
                {plan.modules.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm text-ink-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {label(m)}
                  </li>
                ))}
                {missing.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-sm text-ink-300">
                    <MinusIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {label(m)}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setConfirming(plan)}
                disabled={isCurrent || free || !canBuy || buyingOff}
                className={clsx(
                  'mt-5 w-full',
                  isCurrent ? 'btn-ghost' : copy?.popular ? 'btn-primary' : 'btn-soft',
                )}
              >
                {isCurrent ? 'Current plan' : free ? 'Included' : `Choose ${plan.name}`}
              </button>

              {!isCurrent && !free && !canBuy && (
                <p className="mt-2 text-center text-xs text-ink-400">
                  Only an owner or manager can change the plan.
                </p>
              )}
            </section>
          )
        })}
      </div>

      {/* The cards answer "what do I get"; this answers "what is the difference",
          which is the question somebody comparing two of them actually has. */}
      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-3">
          <h2 className="text-sm font-bold text-ink-900">Compare features</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-ink-500">Feature</th>
                {data.items.map((p) => (
                  <th
                    key={p.code}
                    className={clsx(
                      'px-4 py-2.5 text-center text-xs font-bold',
                      p.code === data.currentCode ? 'text-emerald-700' : 'text-ink-700',
                    )}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allModules.map((m) => (
                <tr key={m} className="border-b border-ink-50 last:border-0">
                  <td className="px-5 py-2.5 text-ink-700">{label(m)}</td>
                  {data.items.map((p) => (
                    <td key={p.code} className="px-4 py-2.5 text-center">
                      {p.modules.includes(m) ? (
                        <CheckIcon className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <MinusIcon className="mx-auto h-4 w-4 text-ink-200" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Faq
          q="What happens to my data if I downgrade?"
          a="Nothing is deleted. Anything above your new plan's limit becomes read-only."
        />
        <Faq
          q="When does a change take effect?"
          a="As soon as the payment clears. The new features appear without signing out."
        />
        <Faq
          q="Can I pay for a year?"
          a="Yes — a year bills as ten months, so two are free. Switch the toggle above."
        />
      </section>

      {confirming && (
        <PlanConfirmModal
          plan={confirming}
          current={current}
          months={months}
          provider={data.providers[0] ?? 'eSewa'}
          busy={subscribe.isPending}
          onClose={() => setConfirming(null)}
          onConfirm={start}
        />
      )}
    </div>
  )
}

function BillingToggle({
  value,
  onChange,
}: {
  value: Billing
  onChange: (next: Billing) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-ink-200 bg-white p-0.5">
        {(['monthly', 'yearly'] as Billing[]).map((period) => (
          <button
            key={period}
            onClick={() => onChange(period)}
            className={clsx(
              'rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition',
              value === period ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-50',
            )}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Outside the control rather than inside one option: a discount that
          disappears the moment you select it reads as a trick. */}
      <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 sm:inline">
        Save 2 months
      </span>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-ink-800">{q}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">{a}</p>
    </div>
  )
}
