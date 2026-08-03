import { useState } from 'react'
import {
  EyeIcon,
  LockClosedIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import StickyHeader from '@/components/common/headers/StickyHeader'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import RoleForm from '@/components/Menu/RoleForm'
import { useDeleteRole, useGetMenuAccess, type ICompanyRole } from '@/components/Menu/menu-query'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'

/**
 * The roles this workshop has, and what each one sees.
 *
 * A list rather than the role × menu grid this used to be. The grid put every
 * role on screen at once, which reads well with four and stops reading at
 * seven — and it had nowhere to put a role's name, what it is based on, or how
 * many people are in it, which turned out to be what people came here to check.
 */
export default function RoleMenus() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const remove = useDeleteRole()

  // The endpoint answers Owner and Manager only. Rendering for anyone else
  // would fill the page with 403s under the words "Failed to load data", which
  // is not true — trying again cannot work.
  const mayRead = user?.role === 'Owner' || user?.role === 'Manager'
  const canEdit = user?.role === 'Owner'

  const { data, isLoading, isError } = useGetMenuAccess(mayRead)

  const [editing, setEditing] = useState<ICompanyRole | 'new' | null>(null)

  if (!mayRead) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span className="rounded-xl bg-ink-100 p-3">
          <LockClosedIcon className="h-6 w-6 text-ink-400" />
        </span>
        <h1 className="mt-4 text-base font-bold text-ink-900">Role setup is owner-only</h1>
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">
          Deciding what each role sees is set by the workshop owner.
        </p>
      </div>
    )
  }

  if (isLoading) return <LoadingBlock label="Loading roles…" />
  if (isError || !data) return <ErrorBlock />

  const onDelete = async (role: ICompanyRole) => {
    const ok = await confirm({
      title: `Remove ${role.name}?`,
      message:
        role.staffCount > 0
          ? `${role.staffCount} account(s) are in this role. Move them to another role first — this will be refused.`
          : 'Nobody is in this role, so nothing is lost.',
      confirmLabel: 'Remove',
      danger: true,
    })

    if (ok) remove.mutate({ id: role.id })
  }

  return (
    <div className="space-y-6">
      <StickyHeader title="Role setup" />

      {!canEdit && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          Only the owner can change these. You can see what each role gets.
        </p>
      )}

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-bold text-ink-900">Roles</h2>

          {canEdit && (
            <button className="btn-primary shrink-0" onClick={() => setEditing('new')}>
              New role
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left">
              <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3">Role</th>
                <th className="px-4 py-3">Based on</th>
                <th className="px-4 py-3">People</th>
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3 text-right">Manage</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-100">
              {data.roles.map((role) => (
                <tr key={role.id} className="hover:bg-ink-50/60">
                  {/* The description lives in the form, not here. It is what
                      somebody typed to remind themselves later, and a column of
                      free text pushed the numbers people scan for off to the
                      right. */}
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold text-ink-900">{role.name}</span>
                      {role.isBuiltIn && <Badge tone="gray">Built in</Badge>}
                    </span>
                  </td>

                  {/* Only worth showing where the two differ — on a built-in row
                      "Owner, based on Owner" is noise. */}
                  <td className="px-4 py-3 text-ink-600">
                    {role.isBuiltIn ? <span className="text-ink-300">—</span> : role.baseRole}
                  </td>

                  <td className="px-4 py-3 text-ink-600">{role.staffCount}</td>

                  <td className="px-4 py-3 text-ink-600">
                    {role.menuCount} of {data.items.length}
                  </td>

                  <td className="px-4 py-3">
                    <span className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditing(role)}
                        title={canEdit ? `Edit ${role.name}` : `View ${role.name}`}
                        aria-label={canEdit ? `Edit ${role.name}` : `View ${role.name}`}
                        className="rounded p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
                      >
                        {canEdit ? (
                          <PencilSquareIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>

                      {/* Drawn only where it works. A greyed-out bin on every
                          row reads as "delete is broken here" rather than "this
                          row cannot be deleted" — and the four built-ins are the
                          only rows most workshops have, so that was the whole
                          column. */}
                      {canEdit && !role.isBuiltIn && (
                        <button
                          onClick={() => onDelete(role)}
                          disabled={remove.isPending}
                          title={`Remove ${role.name}`}
                          aria-label={`Remove ${role.name}`}
                          className="rounded p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <RoleForm
          role={editing === 'new' ? null : editing}
          items={data.items}
          access={data.access}
          canEdit={canEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
