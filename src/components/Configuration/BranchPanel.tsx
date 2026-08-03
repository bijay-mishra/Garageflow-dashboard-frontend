import { useState } from 'react'
import { BuildingOffice2Icon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock, Spinner } from '@/components/common/loaders/States'
import { useConfirm } from '@/context/ConfirmContext'
import {
  useCreateBranch,
  useDeleteBranch,
  useGetConfigBranches,
  useUpdateBranch,
  type IBranchDetail,
} from './configuration-query'

/**
 * The company's locations.
 *
 * Every company has at least one — it gets a main branch when it is created —
 * and the list cannot be emptied. "No branches" is not a state any screen in the
 * product knows how to draw, and the session has to be able to open on one.
 */
export default function BranchPanel({ companyCode }: { companyCode?: string }) {
  const scope = { companyCode }

  const { data: branches = [], isLoading, isError } = useGetConfigBranches(scope)
  const remove = useDeleteBranch(scope)
  const confirm = useConfirm()

  const [editing, setEditing] = useState<IBranchDetail | null>(null)
  const [creating, setCreating] = useState(false)

  if (isLoading) return <LoadingBlock label="Loading branches…" />
  if (isError) return <ErrorBlock />

  const onDelete = async (branch: IBranchDetail) => {
    const ok = await confirm({
      title: `Remove ${branch.name}?`,
      message:
        'The work recorded there stays. Only the location disappears from the branch picker.',
      confirmLabel: 'Remove',
      danger: true,
    })

    if (ok) remove.mutate({ id: branch.id })
  }

  return (
    <>
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-ink-900">Branches</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Where the work happens. Sessions open on the default one, and it cannot be closed or
              removed while it holds that job.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setCreating(true)}>
            New branch
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <BuildingOffice2Icon className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-sm font-semibold text-ink-600">No branches yet</p>
            <p className="mt-1 text-xs text-ink-400">Add the workshop's main location.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left">
                <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-ink-100">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-ink-50/60">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-ink-900">{branch.name}</span>
                      <code className="ml-2 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-500">
                        {branch.id}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{branch.address || '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{branch.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="flex flex-wrap gap-1.5">
                        {branch.isDefault && <Badge tone="blue">Default</Badge>}
                        {branch.isActive ? (
                          <Badge tone="green">Open</Badge>
                        ) : (
                          <Badge tone="gray">Closed</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(branch)}
                          className="rounded p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
                          aria-label={`Edit ${branch.name}`}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(branch)}
                          disabled={remove.isPending || branch.isDefault || branches.length === 1}
                          title={
                            branch.isDefault
                              ? 'Make another branch the default first.'
                              : branches.length === 1
                                ? 'A company needs at least one branch.'
                                : undefined
                          }
                          className="rounded p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`Remove ${branch.name}`}
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
        <BranchForm
          companyCode={companyCode}
          branch={editing}
          isOnly={branches.length === 0}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function BranchForm({
  companyCode,
  branch,
  isOnly,
  onClose,
}: {
  companyCode?: string
  branch: IBranchDetail | null
  isOnly: boolean
  onClose: () => void
}) {
  const scope = { companyCode }
  const create = useCreateBranch(scope)
  const update = useUpdateBranch(scope)

  const [name, setName] = useState(branch?.name ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone, setPhone] = useState(branch?.phone ?? '')
  const [isDefault, setIsDefault] = useState(branch?.isDefault ?? isOnly)
  const [isActive, setIsActive] = useState(branch?.isActive ?? true)

  const busy = create.isPending || update.isPending

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      isDefault,
      isActive,
    }

    if (branch) update.mutate({ id: branch.id, ...payload }, { onSuccess: onClose })
    else create.mutate(payload, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-12 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-bold text-ink-900">
          {branch ? `Edit ${branch.name}` : 'New branch'}
        </h2>
        <p className="mt-0.5 text-xs text-ink-400">A location this workshop works out of.</p>

        <label className="mt-5 block text-xs font-semibold text-ink-600">Name</label>
        <input
          className="input mt-1.5"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lakeside Branch"
          required
        />

        <label className="mt-4 block text-xs font-semibold text-ink-600">Address</label>
        <input
          className="input mt-1.5"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Lakeside Road, Pokhara"
        />

        <label className="mt-4 block text-xs font-semibold text-ink-600">Phone</label>
        <input
          className="input mt-1.5"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+977 61-555222"
        />

        <label className="mt-5 flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={isDefault}
            disabled={branch?.isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-ink-800">Default branch</span>
            <span className="block text-xs text-ink-400">
              {branch?.isDefault
                ? 'Already the default. Make another one the default to move it.'
                : 'Sessions open here, and fall back here.'}
            </span>
          </span>
        </label>

        <label className="mt-3 flex items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={isActive}
            disabled={isDefault}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-ink-800">Open</span>
            <span className="block text-xs text-ink-400">
              {isDefault
                ? 'The default branch cannot be closed.'
                : 'A closed branch keeps its history but cannot be selected.'}
            </span>
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-2 border-t border-ink-100 pt-5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy && <Spinner />} {branch ? 'Save changes' : 'Add branch'}
          </button>
        </div>
      </form>
    </div>
  )
}
