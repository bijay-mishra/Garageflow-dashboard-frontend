import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { CheckIcon } from '@heroicons/react/24/solid'
import Modal from '@/components/common/modals/Modal'
import SearchInput from '@/components/common/form/SearchInput'
import { Spinner } from '@/components/common/loaders/States'
import Badge from '@/components/common/Badge'
import { formatRs } from '@/lib/format'
import type { VehicleType } from '@/components/Vehicle/vehicle-schema'
import { serviceCategoryTone } from './ServiceTable'
import { useGetServiceList } from './service-query'
import { formatDuration, type IService } from './service-schema'

interface ServicePickerModalProps {
  /**
   * Body class of the vehicle on the job. Services restricted to other types are
   * pushed below a divider rather than hidden — a shop that wants to wash a
   * tractor with the car wash is not wrong, it is just unusual.
   */
  vehicleType?: VehicleType
  /** Catalogue ids already on the job. Shown ticked and unselectable. */
  alreadyOn?: string[]
  onConfirm: (services: IService[]) => void
  onClose: () => void
}

/**
 * Picks services off the price list to add to a job card.
 *
 * Multi-select on purpose: "wash and polish" is one decision at the counter, and
 * making it two round trips through a dropdown is how the wash gets forgotten.
 */
export default function ServicePickerModal({
  vehicleType,
  alreadyOn = [],
  onConfirm,
  onClose,
}: ServicePickerModalProps) {
  // `activeOnly` — a retired service must never be offered here.
  const { data: services = [], isLoading } = useGetServiceList(true, true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const onJob = useMemo(() => new Set(alreadyOn), [alreadyOn])

  const { suited, others } = useMemo(() => {
    const term = search.trim().toLowerCase()

    const matching = services.filter(
      (s) =>
        term === '' ||
        s.name.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term),
    )

    // No vehicle chosen yet — nothing to sort by, so everything is "suited".
    if (!vehicleType) return { suited: matching, others: [] as IService[] }

    return {
      suited: matching.filter((s) => s.appliesTo.length === 0 || s.appliesTo.includes(vehicleType)),
      others: matching.filter((s) => s.appliesTo.length > 0 && !s.appliesTo.includes(vehicleType)),
    }
  }, [services, search, vehicleType])

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    )

  const chosen = useMemo(
    () => selected.map((id) => services.find((s) => s.id === id)).filter((s): s is IService => !!s),
    [selected, services],
  )

  const total = chosen.reduce((sum, s) => sum + s.price, 0)

  return (
    <Modal
      title="Add from the price list"
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <div className="mr-auto text-sm">
            <span className="text-ink-400">
              {chosen.length === 0 ? 'Nothing selected' : `${chosen.length} selected · `}
            </span>
            {chosen.length > 0 && <span className="font-bold text-ink-900">{formatRs(total)}</span>}
          </div>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            type="button"
            disabled={chosen.length === 0}
            onClick={() => {
              onConfirm(chosen)
              onClose()
            }}
          >
            Add {chosen.length > 0 && chosen.length}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search wash, polish, alignment…" />

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : services.length === 0 ? (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-8 text-center text-xs text-ink-400">
            The price list is empty. Add what the workshop offers under Services.
          </p>
        ) : (
          <div className="space-y-1.5">
            {suited.map((service) => (
              <Row
                key={service.id}
                service={service}
                selected={selected.includes(service.id)}
                disabled={onJob.has(service.id)}
                onToggle={() => toggle(service.id)}
              />
            ))}

            {others.length > 0 && (
              <>
                <p className="px-1 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-400">
                  Not usually offered for a {vehicleType?.toLowerCase()}
                </p>
                {others.map((service) => (
                  <Row
                    key={service.id}
                    service={service}
                    selected={selected.includes(service.id)}
                    disabled={onJob.has(service.id)}
                    onToggle={() => toggle(service.id)}
                  />
                ))}
              </>
            )}

            {suited.length === 0 && others.length === 0 && (
              <p className="rounded-lg border border-dashed border-ink-200 px-3 py-8 text-center text-xs text-ink-400">
                Nothing matches “{search}”.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

function Row({
  service,
  selected,
  disabled,
  onToggle,
}: {
  service: IService
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      aria-pressed={selected}
      disabled={disabled}
      className={clsx(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition',
        disabled
          ? 'cursor-default border-ink-100 bg-ink-50 opacity-60'
          : selected
            ? 'border-brand-500 bg-brand-50'
            : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50',
      )}
    >
      <span
        className={clsx(
          // h-4, not h-4.5 — Tailwind's default scale has no 4.5, so the class
          // was dropped and the tick box collapsed to nothing.
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
          selected || disabled ? 'border-brand-600 bg-brand-600' : 'border-ink-300 bg-white',
        )}
      >
        {(selected || disabled) && <CheckIcon className="h-3 w-3 text-white" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-ink-900">{service.name}</span>
          <Badge tone={serviceCategoryTone[service.category]}>{service.category}</Badge>
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-400">
          {disabled
            ? 'Already on this job'
            : service.description || formatDuration(service.durationMinutes)}
        </span>
      </span>

      <span className="shrink-0 text-sm font-bold text-ink-900">{formatRs(service.price)}</span>
    </button>
  )
}
