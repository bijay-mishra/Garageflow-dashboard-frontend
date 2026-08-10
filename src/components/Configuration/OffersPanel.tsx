import { useEffect, useState } from 'react'
import { PencilSquareIcon, TagIcon, TrashIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { useConfirm } from '@/context/ConfirmContext'
import { useGetServiceList } from '@/components/Service/service-query'
import { SERVICE_CATEGORIES } from '@/components/Service/service-schema'
import { VEHICLE_TYPES } from '@/components/Vehicle/vehicle-schema'
import {
  useCreateOffer,
  useDeleteOffer,
  useGetLoyaltyProgram,
  useGetOffers,
  useSaveLoyaltyProgram,
  useUpdateOffer,
  type IOffer,
  type ISaveOffer,
} from './offers-query'

/**
 * What the workshop gives away: the stamp card, points, and promotions.
 *
 * Three schemes on one screen because they are one decision — a workshop is
 * choosing how much of a bill it is prepared to hand back, and seeing "4 jobs
 * earns a free Rs 1,200 wash" beside "20% off washing" is the only way to
 * notice that a customer can have both at once.
 *
 * They stack in a fixed order on a bill: offer, then reward, then points, each
 * measured against what is left. That is spelled out on screen rather than left
 * in the API, because it is the question an owner asks first.
 */
export default function OffersPanel() {
  const { data: program, isLoading, isError } = useGetLoyaltyProgram()
  const { data: offers = [] } = useGetOffers()
  const { data: services = [] } = useGetServiceList()

  const save = useSaveLoyaltyProgram()
  const remove = useDeleteOffer()
  const confirm = useConfirm()

  const [editing, setEditing] = useState<IOffer | null>(null)
  const [creating, setCreating] = useState(false)

  // Local copy so typing in a number field does not fire a request per keystroke.
  // Seeded from the server once it answers, and re-seeded whenever it does —
  // otherwise a save that the server adjusted would leave the form showing what
  // was typed rather than what was stored.
  const [form, setForm] = useState({
    stampCardEnabled: false,
    jobsPerReward: 4,
    rewardServiceId: '' as string,
    pointsEnabled: false,
    rupeesPerPoint: 100,
    pointValue: 1,
    minimumPointsToRedeem: 100,
    maxPointsPercent: 50,
  })

  useEffect(() => {
    if (!program) return

    setForm({
      stampCardEnabled: program.stampCardEnabled,
      jobsPerReward: program.jobsPerReward,
      rewardServiceId: program.rewardServiceId ?? '',
      pointsEnabled: program.pointsEnabled,
      rupeesPerPoint: program.rupeesPerPoint,
      pointValue: program.pointValue,
      minimumPointsToRedeem: program.minimumPointsToRedeem,
      // Stored as a fraction, typed as a percentage. Nobody types 0.5 when they
      // mean half.
      maxPointsPercent: Math.round(program.maxPointsShareOfBill * 100),
    })
  }, [program])

  if (isLoading) return <LoadingBlock label="Loading offers…" />
  if (isError) return <ErrorBlock />

  const reward = services.find((s) => s.id === form.rewardServiceId)

  const onSaveProgram = () =>
    save.mutate({
      stampCardEnabled: form.stampCardEnabled,
      jobsPerReward: form.jobsPerReward,
      rewardServiceId: form.rewardServiceId || null,
      pointsEnabled: form.pointsEnabled,
      rupeesPerPoint: form.rupeesPerPoint,
      pointValue: form.pointValue,
      minimumPointsToRedeem: form.minimumPointsToRedeem,
      maxPointsShareOfBill: form.maxPointsPercent / 100,
    })

  const onDelete = async (offer: IOffer) => {
    const ok = await confirm({
      title: `Delete ${offer.name}?`,
      message:
        'Bills that already carried this discount keep it — each one records what came off and why. To stop it applying to new bills without deleting it, switch it off instead.',
      confirmLabel: 'Delete',
      danger: true,
    })

    if (ok) remove.mutate({ id: offer.id })
  }

  return (
    <>
      {/* ── Stamp card ─────────────────────────────────────────────────── */}
      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Stamp card</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                Every completed job is one stamp. A full card earns one service free.
              </p>
            </div>
            <Toggle
              checked={form.stampCardEnabled}
              onChange={(stampCardEnabled) => setForm({ ...form, stampCardEnabled })}
            />
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label="Jobs per reward" hint="How many completed jobs fill a card.">
            <input
              type="number"
              min={1}
              max={100}
              className="input"
              value={form.jobsPerReward}
              onChange={(e) => setForm({ ...form, jobsPerReward: Number(e.target.value) })}
            />
          </Field>

          <Field
            label="The reward"
            hint="From your own price list. Its current price is what comes off the bill."
          >
            <select
              className="input"
              value={form.rewardServiceId}
              onChange={(e) => setForm({ ...form, rewardServiceId: e.target.value })}
            >
              <option value="">Choose a service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Rs {s.price.toLocaleString()}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {form.stampCardEnabled && !form.rewardServiceId && (
          <Note tone="warn">
            Choose which service the reward gives. A card switched on with nothing behind it fills
            up and pays out nothing.
          </Note>
        )}

        {form.stampCardEnabled && reward && (
          <Note>
            A customer completing {form.jobsPerReward} jobs earns{' '}
            <strong>
              {reward.name}, free — worth Rs {reward.price.toLocaleString()}
            </strong>
            . Capped at the bill it is used on, so it never pays money back.
          </Note>
        )}
      </section>

      {/* ── Points ─────────────────────────────────────────────────────── */}
      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-ink-900">Points</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                Earned on what is actually paid, not on what is billed — so an unpaid invoice earns
                nothing.
              </p>
            </div>
            <Toggle
              checked={form.pointsEnabled}
              onChange={(pointsEnabled) => setForm({ ...form, pointsEnabled })}
            />
          </div>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Rupees per point" hint="Rs paid that earn one point.">
            <input
              type="number"
              min={1}
              className="input"
              value={form.rupeesPerPoint}
              onChange={(e) => setForm({ ...form, rupeesPerPoint: Number(e.target.value) })}
            />
          </Field>

          <Field label="A point is worth (Rs)" hint="What one point takes off a bill.">
            <input
              type="number"
              min={0.01}
              step={0.01}
              className="input"
              value={form.pointValue}
              onChange={(e) => setForm({ ...form, pointValue: Number(e.target.value) })}
            />
          </Field>

          <Field label="Minimum to redeem" hint="Below this, points cannot be spent.">
            <input
              type="number"
              min={0}
              className="input"
              value={form.minimumPointsToRedeem}
              onChange={(e) =>
                setForm({ ...form, minimumPointsToRedeem: Number(e.target.value) })
              }
            />
          </Field>

          <Field label="Most of a bill (%)" hint="Ceiling on how much points may cover.">
            <input
              type="number"
              min={1}
              max={100}
              className="input"
              value={form.maxPointsPercent}
              onChange={(e) => setForm({ ...form, maxPointsPercent: Number(e.target.value) })}
            />
          </Field>
        </div>

        {form.pointsEnabled && (
          <Note>
            Paying Rs {(form.rupeesPerPoint * 10).toLocaleString()} earns 10 points, worth{' '}
            <strong>Rs {(form.pointValue * 10).toLocaleString()}</strong> off a later bill — about{' '}
            {((form.pointValue / form.rupeesPerPoint) * 100).toFixed(1)}% back. Points may cover at
            most {form.maxPointsPercent}% of any one bill.
          </Note>
        )}

        <div className="flex justify-end border-t border-ink-100 px-5 py-3">
          <button className="btn-primary" onClick={onSaveProgram} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save scheme'}
          </button>
        </div>
      </section>

      {/* ── Offers ─────────────────────────────────────────────────────── */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-ink-900">Offers</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              A percentage off, for a window, for some of the price list. Only the largest matching
              offer applies to a bill — they do not stack.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            New offer
          </button>
        </div>

        {offers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <TagIcon className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm font-semibold text-ink-600">No offers yet</p>
            <p className="mt-1 text-xs text-ink-400">
              A festival promotion, or a standing discount on one kind of work.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold text-ink-400">
                  <th className="px-5 py-2.5">Offer</th>
                  <th className="px-5 py-2.5">Discount</th>
                  <th className="px-5 py-2.5">Applies to</th>
                  <th className="px-5 py-2.5">Window</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-900">{offer.name}</span>
                        {/* Three states, not two. "Active but not started yet"
                            and "switched off" both fail to discount a bill, and
                            collapsing them is how an owner spends an afternoon
                            wondering why their promotion does nothing. */}
                        {offer.runsToday ? (
                          <Badge tone="green">Running</Badge>
                        ) : (
                          <Badge tone="gray">{offer.isActive ? 'Scheduled' : 'Off'}</Badge>
                        )}
                      </div>
                      {offer.description && (
                        <p className="mt-0.5 text-xs text-ink-400">{offer.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {offer.percent}%
                      {offer.maxDiscount != null && (
                        <span className="block text-xs text-ink-400">
                          max Rs {offer.maxDiscount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500">{describeScope(offer)}</td>
                    <td className="px-5 py-3 text-xs text-ink-500">{describeWindow(offer)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-ghost px-2"
                          onClick={() => setEditing(offer)}
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost px-2 text-rose-600"
                          onClick={() => onDelete(offer)}
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(creating || editing) && (
        <OfferDialog
          offer={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

/** One offer's filters, as a sentence. Empty filters mean "everything". */
function describeScope(offer: IOffer): string {
  const parts: string[] = []

  if (offer.categories.length) parts.push(offer.categories.join(', '))
  if (offer.serviceIds.length) parts.push(`${offer.serviceIds.length} named service(s)`)
  if (offer.vehicleTypes.length) parts.push(offer.vehicleTypes.join(', '))

  return parts.length ? parts.join(' · ') : 'Everything'
}

function describeWindow(offer: IOffer): string {
  if (!offer.startsOn && !offer.endsOn) return 'No end date'
  if (offer.startsOn && offer.endsOn) return `${offer.startsOn} → ${offer.endsOn}`
  if (offer.startsOn) return `From ${offer.startsOn}`
  return `Until ${offer.endsOn}`
}

function OfferDialog({ offer, onClose }: { offer: IOffer | null; onClose: () => void }) {
  const create = useCreateOffer()
  const update = useUpdateOffer()
  const { data: services = [] } = useGetServiceList()

  const [form, setForm] = useState<ISaveOffer>({
    name: offer?.name ?? '',
    description: offer?.description ?? '',
    percent: offer?.percent ?? 10,
    maxDiscount: offer?.maxDiscount ?? null,
    startsOn: offer?.startsOn ?? null,
    endsOn: offer?.endsOn ?? null,
    serviceIds: offer?.serviceIds ?? [],
    categories: offer?.categories ?? [],
    vehicleTypes: offer?.vehicleTypes ?? [],
    isActive: offer?.isActive ?? true,
  })

  const badWindow = !!form.startsOn && !!form.endsOn && form.endsOn < form.startsOn

  const onSubmit = () => {
    if (badWindow || !form.name.trim()) return

    const done = () => onClose()

    if (offer) update.mutate({ id: offer.id, ...form }, { onSuccess: done })
    else create.mutate(form, { onSuccess: done })
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4">
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-bold text-ink-900">{offer ? 'Edit offer' : 'New offer'}</h2>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              className="input"
              value={form.name}
              placeholder="Dashain week"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Discount (%)">
            <input
              type="number"
              min={0.01}
              max={100}
              className="input"
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: Number(e.target.value) })}
            />
          </Field>

          <Field label="Description" hint="Shown to customers in the app.">
            <input
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <Field
            label="Most it can take off (Rs)"
            hint="Blank for no cap. The difference between a promotion and an open liability on a large bill."
          >
            <input
              type="number"
              min={1}
              className="input"
              value={form.maxDiscount ?? ''}
              onChange={(e) =>
                setForm({ ...form, maxDiscount: e.target.value ? Number(e.target.value) : null })
              }
            />
          </Field>

          <Field label="Starts" hint="Blank starts it immediately.">
            <input
              type="date"
              className="input"
              value={form.startsOn ?? ''}
              onChange={(e) => setForm({ ...form, startsOn: e.target.value || null })}
            />
          </Field>

          <Field label="Ends" hint="Inclusive. Blank runs until switched off.">
            <input
              type="date"
              className="input"
              value={form.endsOn ?? ''}
              onChange={(e) => setForm({ ...form, endsOn: e.target.value || null })}
            />
          </Field>
        </div>

        {badWindow && <Note tone="warn">The offer cannot end before it starts.</Note>}

        <div className="space-y-4 px-5 pb-4">
          <Picker
            label="Categories"
            hint="Leave all unticked to cover every category."
            options={[...SERVICE_CATEGORIES]}
            selected={form.categories}
            onToggle={(v) => setForm({ ...form, categories: toggle(form.categories, v) })}
          />

          <Picker
            label="Vehicle types"
            hint="Leave all unticked to cover every vehicle."
            options={[...VEHICLE_TYPES]}
            selected={form.vehicleTypes}
            onToggle={(v) => setForm({ ...form, vehicleTypes: toggle(form.vehicleTypes, v) })}
          />

          <Picker
            label="Named services"
            hint="Narrower than a category. Leave unticked unless you mean specific rows."
            options={services.map((s) => s.id)}
            labels={Object.fromEntries(services.map((s) => [s.id, s.name]))}
            selected={form.serviceIds}
            onToggle={(v) => setForm({ ...form, serviceIds: toggle(form.serviceIds, v) })}
          />

          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={badWindow || !form.name.trim() || create.isPending || update.isPending}
          >
            {offer ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {checked ? 'On' : 'Off'}
    </label>
  )
}

/** A checkbox row where none ticked means "all of them". */
function Picker({
  label,
  hint,
  options,
  labels,
  selected,
  onToggle,
}: {
  label: string
  hint: string
  options: string[]
  labels?: Record<string, string>
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      <span className="text-xs font-semibold text-ink-600">{label}</span>
      <p className="text-xs text-ink-400">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option)

          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={
                on
                  ? 'rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white'
                  : 'rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600'
              }
            >
              {labels?.[option] ?? option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Note({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
  return (
    <p
      className={
        tone === 'warn'
          ? 'border-t border-ink-100 bg-amber-50 px-5 py-3 text-xs text-amber-800'
          : 'border-t border-ink-100 bg-ink-50 px-5 py-3 text-xs text-ink-500'
      }
    >
      {children}
    </p>
  )
}
