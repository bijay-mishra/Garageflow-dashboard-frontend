import { useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import { useDeleteCompany, type ICompany } from './superadmin-query'

/**
 * The last stop before a company is erased.
 *
 * Type-the-code rather than a yes/no dialog, and deliberately so. A confirm
 * button can be cleared by the same reflex that opened it — people dismiss
 * dialogs without reading them all day. Typing "KOSHI" cannot happen by
 * momentum: it requires reading which company this is, which is exactly the
 * mistake worth catching.
 *
 * The counts are shown for the same reason. "Delete this company?" is abstract;
 * "312 customers, 1,204 job cards" is the thing that actually goes.
 */
export default function DeleteCompanyDialog({
  company,
  onClose,
  onDeleted,
}: {
  company: ICompany
  onClose: () => void
  onDeleted: () => void
}) {
  const deleteCompany = useDeleteCompany()
  const [typed, setTyped] = useState('')

  const matches = typed.trim().toUpperCase() === company.companyCode.toUpperCase()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matches) return

    try {
      await deleteCompany.mutateAsync({
        code: company.companyCode,
        confirmCompanyCode: typed.trim(),
      })
      onDeleted()
    } catch {
      /* handled by the mutation's onError */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-16 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="shrink-0 rounded-lg bg-rose-50 p-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink-900">Delete {company.name}?</h2>
            <p className="mt-1 text-xs text-ink-500">
              This cannot be undone. There is no backup on this platform.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5 rounded-md bg-ink-50 p-4 text-sm text-ink-700">
          <Line count={company.customerCount} noun="customer" />
          <Line count={company.jobCount} noun="job card" />
          <Line count={company.userCount} noun="staff account" />
          <li className="text-ink-500">…and every vehicle, bill and payment recorded against them.</li>
        </ul>

        <label htmlFor="confirm-code" className="mt-5 block text-xs font-semibold text-ink-600">
          Type <span className="font-bold text-ink-900">{company.companyCode}</span> to confirm
        </label>
        <input
          id="confirm-code"
          className="input mt-1.5"
          value={typed}
          autoComplete="off"
          autoFocus
          onChange={(e) => setTyped(e.target.value)}
          placeholder={company.companyCode}
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
            disabled={deleteCompany.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!matches || deleteCompany.isPending}
            className="flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleteCompany.isPending && <Spinner />} Delete permanently
          </button>
        </div>
      </form>
    </div>
  )
}

function Line({ count, noun }: { count: number; noun: string }) {
  return (
    <li>
      <span className="font-bold text-ink-900">{count.toLocaleString()}</span>{' '}
      {count === 1 ? noun : `${noun}s`}
    </li>
  )
}
