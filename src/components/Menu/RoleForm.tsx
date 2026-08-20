import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import RoleMenuTree from './RoleMenuTree'
import {
  BASE_ROLES,
  useCreateRole,
  useSaveMenuAccess,
  useUpdateRole,
  type ICompanyRole,
  type IMenuItem,
} from './menu-query'

/**
 * A role: what it is called, what it can do, and what it sees.
 *
 * All three in one modal because they are one decision. Splitting the menu onto
 * its own screen meant adding a role and then remembering to go back and tell it
 * what to show — and a role whose menu nobody set is a role that quietly
 * inherits somebody else's.
 *
 * Two requests on save, not one: the role and its menu are separate endpoints,
 * and the menu has to be written under the name the role ends up with. Renaming
 * and re-ticking in the same edit therefore saves in that order.
 */
export default function RoleForm({
  role,
  items,
  access,
  canEdit,
  onClose,
}: {
  role: ICompanyRole | null
  items: IMenuItem[]
  /** role name → menu key → visible, for every role. Seeds a new role from its base. */
  access: Record<string, Record<string, boolean>>
  /** False for a manager, who may read this screen but not change it. */
  canEdit: boolean
  onClose: () => void
}) {
  const create = useCreateRole()
  const update = useUpdateRole()
  const saveMenu = useSaveMenuAccess()

  const [name, setName] = useState(role?.name ?? '')
  const [baseRole, setBaseRole] = useState(role?.baseRole ?? 'Advisor')
  const [description, setDescription] = useState(role?.description ?? '')

  const [menu, setMenu] = useState<Record<string, boolean>>(
    () => access[role?.name ?? ''] ?? access[role?.baseRole ?? 'Advisor'] ?? {},
  )

  // A new role starts from what the role it is based on sees, and follows that
  // dropdown until it is saved. Picking Owner and getting the front desk's menu
  // would be a surprise, and there is nothing else the ticks could sensibly be.
  useEffect(() => {
    if (!role) setMenu(access[baseRole] ?? {})
  }, [role, baseRole, access])

  const busy = create.isPending || update.isPending || saveMenu.isPending

  // Re-basing rewrites what everyone in the role may do, so the server refuses
  // it while anybody is there.
  const baseLocked = Boolean(role && role.staffCount > 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalName = name.trim()
    if (!finalName) return

    try {
      if (role) await update.mutateAsync({ id: role.id, name: finalName, baseRole, description })
      else await create.mutateAsync({ name: finalName, baseRole, description })

      await saveMenu.mutateAsync({ role: finalName, access: menu })
      onClose()
    } catch {
      /* handled by the mutations' onError */
    }
  }

  const shown = items.filter((m) => menu[m.key]).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
          <h2 className="truncate text-sm font-bold text-ink-900">
            {!canEdit ? role?.name : role ? `Edit ${role.name}` : 'New role'}
          </h2>

          {/* The close affordance people look for. Cancel is still there, at the
              bottom with Update, where a decision to abandon an edit belongs —
              this one is for "I opened the wrong row". */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3.5 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink-600">Name</label>
              <input
                className="input mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CEO, Front desk…"
                disabled={!canEdit || role?.isBuiltIn}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-600">Based on</label>
              <select
                className="input mt-1.5"
                value={baseRole}
                onChange={(e) => setBaseRole(e.target.value)}
                disabled={!canEdit || role?.isBuiltIn || baseLocked}
              >
                {BASE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {baseLocked && !role?.isBuiltIn && (
            <p className="text-[11px] text-amber-600">
              {role?.staffCount} account(s) are in this role, so what it is based on is locked.
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-600">
              Description <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <input
              className="input mt-1.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="text-xs font-semibold text-ink-600">Menu</label>
              <span className="text-[11px] text-ink-400">
                {shown} of {items.length}
              </span>
            </div>

            <RoleMenuTree items={items} value={menu} onChange={setMenu} disabled={!canEdit} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3.5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            {canEdit ? 'Cancel' : 'Close'}
          </button>

          {canEdit && (
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy && <Spinner />} {role ? 'Update' : 'Add role'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
