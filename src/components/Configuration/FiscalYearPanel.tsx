import { useState } from 'react'
import { CalendarDaysIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock, Spinner } from '@/components/common/loaders/States'
import { useConfirm } from '@/context/ConfirmContext'
import {
  useCreateFiscalYear,
  useDeleteFiscalYear,
  useGetFiscalYears,
  useUpdateFiscalYear,
  type IFiscalYearRecord,
} from './configuration-query'
import { useDateFormat } from '@/hooks/useDateFormat'
import { fiscalYearLabel } from '@/lib/nepaliDate'

/**
 * The accounting years this company keeps.
 *
 * Seeded from the published national calendar the first time it is opened, so a
 * new workshop sees the right years rather than a blank page and a New button.
 * Shrawan 1 is not a preference — a workshop should be correcting a calendar,
 * never typing one from memory.
 */
export default function FiscalYearPanel({ companyCode }: { companyCode?: string }) {
  const scope = { companyCode }

  const { data: years = [], isLoading, isError } = useGetFiscalYears(scope)
  const remove = useDeleteFiscalYear(scope)
  const confirm = useConfirm()
  const { date, lang } = useDateFormat()

  const [editing, setEditing] = useState<IFiscalYearRecord | null>(null)
  const [creating, setCreating] = useState(false)

  if (isLoading) return <LoadingBlock label="Loading fiscal years…" />
  if (isError) return <ErrorBlock />

  const onDelete = async (year: IFiscalYearRecord) => {
    const ok = await confirm({
      title: `Remove ${year.code}?`,
      message:
        year.invoiceCount > 0 || year.jobCount > 0
          ? `${year.invoiceCount} bill(s) and ${year.jobCount} job card(s) fall in this window. Closing the year keeps them readable; removing it does not.`
          : 'Nothing is filed under it yet, so nothing is lost.',
      confirmLabel: 'Remove',
      danger: true,
    })

    if (ok) remove.mutate({ id: year.id })
  }

  return (
    <>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-ink-900">Fiscal years</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Shrawan 1 to Ashadh end. Close a year when the books are done; keep it to read it.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            New fiscal year
          </button>
        </div>

        {years.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <CalendarDaysIcon className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm font-semibold text-ink-600">No fiscal years yet</p>
            <p className="mt-1 text-xs text-ink-400">Add the year your books run on.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left">
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Year</th>
                  <th className="px-4 py-3">Runs</th>
                  <th className="px-4 py-3">Filed under it</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {years.map((year) => (
                  <tr key={year.id} className="hover:bg-ink-50/60">
                    <td className="px-5 py-3">
                      <span className="block font-semibold text-ink-900">{year.code}</span>
                      {/* The Gregorian span beneath the BS code — the same
                          pairing the topbar picker shows, so the year you
                          switched to is recognisable in the list you edit it
                          from. Redundant in Nepali, where the code already is
                          the label. */}
                      {lang === 'en' && (
                        <span className="block text-[10px] text-ink-400">
                          {fiscalYearLabel(year, 'en')} AD
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {date(year.start)} – {date(year.end)}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {year.invoiceCount} bills · {year.jobCount} jobs
                    </td>
                    <td className="px-4 py-3">
                      {year.isCurrent ? (
                        <Badge tone="green">Current</Badge>
                      ) : year.isClosed ? (
                        <Badge tone="gray">Closed</Badge>
                      ) : (
                        <Badge tone="blue">Open</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(year)}
                          className="rounded p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
                          aria-label={`Edit ${year.code}`}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(year)}
                          disabled={remove.isPending}
                          className="rounded p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                          aria-label={`Remove ${year.code}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(creating || editing) && (
        <FiscalYearForm
          companyCode={companyCode}
          year={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function FiscalYearForm({
  companyCode,
  year,
  onClose,
}: {
  companyCode?: string
  year: IFiscalYearRecord | null
  onClose: () => void
}) {
  const scope = { companyCode }
  const create = useCreateFiscalYear(scope)
  const update = useUpdateFiscalYear(scope)

  const [code, setCode] = useState(year?.code ?? '')
  const [start, setStart] = useState(year?.start ?? '')
  const [end, setEnd] = useState(year?.end ?? '')
  const [isClosed, setIsClosed] = useState(year?.isClosed ?? false)

  const busy = create.isPending || update.isPending

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = { code: code.trim(), start, end, isClosed }

    if (year) update.mutate({ id: year.id, ...payload }, { onSuccess: onClose })
    else create.mutate(payload, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-12 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-bold text-ink-900">
          {year ? `Edit ${year.code}` : 'New fiscal year'}
        </h2>
        <p className="mt-0.5 text-xs text-ink-400">
          The Nepali accounting year, written as it is spoken.
        </p>

        <label className="mt-5 block text-xs font-semibold text-ink-600">Year</label>
        <input
          className="input mt-1.5"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="2082/83"
          required
        />

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-ink-600">First day</label>
            <input
              type="date"
              className="input mt-1.5"
              value={start.slice(0, 10)}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-600">Last day</label>
            <input
              type="date"
              className="input mt-1.5"
              value={end.slice(0, 10)}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
        </div>

        <p className="mt-2 text-xs text-ink-400">
          Moving these changes which side of a year a bill falls on. The published dates are already
          filled in for the years that came with the calendar.
        </p>

        <label className="mt-4 flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={isClosed}
            onChange={(e) => setIsClosed(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-ink-800">Books are closed</span>
            <span className="block text-xs text-ink-400">
              Still readable. Marks that the accountant has finished with it.
            </span>
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-2 border-t border-ink-100 pt-5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy && <Spinner />} {year ? 'Save changes' : 'Add year'}
          </button>
        </div>
      </form>
    </div>
  )
}
