import { useState } from 'react'
import { CheckIcon, MinusIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import StickyHeader from '@/components/common/headers/StickyHeader'
import { useToast } from '@/context/ToastContext'
import { usePlan, type PlanId } from '@/context/PlanContext'
import { formatRs } from '@/lib/format'

type Billing = 'monthly' | 'yearly'

interface Plan {
  id: PlanId
  name: string
  blurb: string
  /** Monthly price in Rs. Yearly bills ten months — two are free. */
  monthly: number
  popular?: boolean
  features: string[]
  missing?: string[]
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    blurb: 'For a single bay getting off paper.',
    monthly: 0,
    features: [
      'Up to 100 job cards a month',
      'Customers & vehicle records',
      'Invoicing with VAT',
      'CSV export',
      '1 user',
    ],
    missing: ['SMS reminders', 'Fiscal-year switching', 'Multi-branch', 'Online booking'],
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'For a busy workshop with a full team.',
    monthly: 2499,
    popular: true,
    features: [
      'Unlimited job cards',
      'SMS service reminders',
      'Fiscal-year switching',
      'Online booking page',
      'Parts & labour price list',
      'Up to 10 users',
      'Priority email support',
    ],
    missing: ['Multi-branch'],
  },
  {
    id: 'business',
    name: 'Business',
    blurb: 'For several branches under one roof.',
    monthly: 5999,
    features: [
      'Everything in Pro',
      'Multi-branch switching with shared customers',
      'Branch-wise reporting',
      'Role-based permissions',
      'Unlimited users',
      'Phone support',
    ],
  },
]

export default function Plans() {
  const toast = useToast()
  const { plan: currentPlan, setPlan } = usePlan()
  const [billing, setBilling] = useState<Billing>('monthly')

  const priceOf = (plan: Plan) => (billing === 'monthly' ? plan.monthly : plan.monthly * 10)

  // No billing backend yet, so switching plans just moves the local feature
  // gate — enough to try the premium features out.
  const choose = (plan: Plan) => {
    if (plan.id === currentPlan) return
    setPlan(plan.id)
    toast.success(`Switched to ${plan.name}. Billing is not connected yet.`)
  }

  return (
    <div className="space-y-6">
      <StickyHeader title="Plans">
        {/* Billing period switch */}
        <div className="flex rounded-md border border-ink-200 bg-white p-0.5">
          {(['monthly', 'yearly'] as Billing[]).map((period) => (
            <button
              key={period}
              onClick={() => setBilling(period)}
              className={clsx(
                'rounded px-3 py-1.5 text-xs font-semibold capitalize transition',
                billing === period ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-50',
              )}
            >
              {period}
              {period === 'yearly' && billing !== 'yearly' && <span className="ml-1 text-emerald-600">−17%</span>}
            </button>
          ))}
        </div>
      </StickyHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const current = plan.id === currentPlan
          return (
            <section
              key={plan.id}
              className={clsx(
                'card flex flex-col p-5 animate-fade-in',
                plan.popular && 'ring-2 ring-brand-500',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-ink-900">{plan.name}</h2>
                  <p className="mt-0.5 text-xs text-ink-500">{plan.blurb}</p>
                </div>
                {plan.popular && (
                  <span className="shrink-0 rounded bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
                    Most popular
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-ink-900">
                  {plan.monthly === 0 ? 'Free' : formatRs(priceOf(plan))}
                </span>
                {plan.monthly > 0 && (
                  <span className="text-xs text-ink-400">/{billing === 'monthly' ? 'month' : 'year'}</span>
                )}
              </div>
              {plan.monthly > 0 && billing === 'yearly' && (
                <p className="mt-1 text-xs text-emerald-600">Two months free — billed annually</p>
              )}

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-700">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
                {plan.missing?.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-400">
                    <MinusIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => choose(plan)}
                disabled={current}
                className={clsx('mt-5 w-full', current ? 'btn-ghost' : plan.popular ? 'btn-primary' : 'btn-soft')}
              >
                {current ? 'Current plan' : plan.monthly === 0 ? 'Downgrade' : `Upgrade to ${plan.name}`}
              </button>
            </section>
          )
        })}
      </div>

      <section className="card p-5">
        <h3 className="text-sm font-bold text-ink-900">Billing questions</h3>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Faq q="Can I change plan later?" a="Yes — switch any time. Changes take effect on the next billing date and unused days are credited." />
          <Faq q="What happens to my data?" a="Nothing is deleted when you downgrade. Features above your plan's limit become read-only." />
          <Faq q="How do I pay?" a="eSewa, Khalti, bank transfer or card. Annual plans can be invoiced against your PAN." />
        </dl>
      </section>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-ink-800">{q}</dt>
      <dd className="mt-1 text-xs text-ink-500">{a}</dd>
    </div>
  )
}
