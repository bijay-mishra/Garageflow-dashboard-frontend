import { useState } from 'react'
import clsx from 'clsx'
import { ArrowDownIcon, ArrowUpIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { Spinner } from '@/components/common/loaders/States'
import { useGetMenuCatalogue, useUpdateMenu, type ISuperAdminMenu } from '../superadmin-query'
import { iconFor, ICON_NAMES } from '@/lib/menuIcons'

/**
 * The sidebar every company draws from.
 *
 * What is editable here is deliberately narrow: the wording in both languages,
 * the icon, the order, which module gates it, and whether it exists at all.
 * Not the key and not the route — both name a React screen that has to exist in
 * the bundle, so editing either would produce a menu entry leading to a 404 with
 * a friendly label on it.
 *
 * A company then decides which of these its roles see, on its own Menu access
 * screen. This is the catalogue; that is the choosing.
 */
export default function MenusTab({ modules }: { modules: string[] }) {
  const { data: menus = [], isLoading } = useGetMenuCatalogue()
  const update = useUpdateMenu()

  const [editing, setEditing] = useState<string | null>(null)

  if (isLoading) return <p className="text-sm text-ink-400">Loading menu…</p>

  const move = (item: ISuperAdminMenu, direction: -1 | 1) => {
    // Only among siblings: a child swapping order with a top-level row would
    // reparent itself in the sidebar's eyes and land somewhere nobody asked for.
    const siblings = menus.filter((m) => m.parentKey === item.parentKey)
    const at = siblings.findIndex((m) => m.key === item.key)
    const swap = siblings[at + direction]

    if (!swap) return

    update.mutate({ key: item.key, sortOrder: swap.sortOrder })
    update.mutate({ key: swap.key, sortOrder: item.sortOrder })
  }

  return (
    <>
      <section className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Menu catalogue</h2>
        <p className="mt-1 max-w-2xl text-xs text-ink-500">
          Every row the dashboard can draw, for every company. Retiring one removes it everywhere;
          each company still chooses which of the remaining rows its roles see.
        </p>
        <p className="mt-2 max-w-2xl text-xs text-ink-400">
          The key and the route are fixed — they name a screen that has to exist in the app.
        </p>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left">
              <tr className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3">Row</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Gated by</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Shown</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-ink-100">
              {menus.map((item) => {
                const Icon = iconFor(item.icon)

                return (
                  <tr key={item.key} className={clsx(!item.isActive && 'bg-ink-50/70')}>
                    <td className="px-5 py-2.5">
                      <button
                        onClick={() => setEditing(editing === item.key ? null : item.key)}
                        className={clsx(
                          'flex items-center gap-2.5 text-left',
                          item.parentKey && 'pl-5',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-ink-400" />
                        <span>
                          <span
                            className={clsx(
                              'block font-semibold',
                              item.isActive ? 'text-ink-900' : 'text-ink-400 line-through',
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="block text-[11px] text-ink-400">{item.labelNe}</span>
                        </span>
                        {item.isLocked && (
                          <LockClosedIcon
                            className="h-3.5 w-3.5 shrink-0 text-ink-300"
                            title="Cannot be retired — every user needs it to navigate."
                          />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-2.5">
                      <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-500">
                        {item.route || '—'}
                      </code>
                    </td>

                    <td className="px-4 py-2.5">
                      <select
                        className="input h-8 py-0 text-xs"
                        value={item.module ?? ''}
                        disabled={update.isPending}
                        onChange={(e) => update.mutate({ key: item.key, module: e.target.value })}
                      >
                        <option value="">Always shown</option>
                        {modules.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-2.5">
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => move(item, -1)}
                          disabled={update.isPending}
                          className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40"
                          aria-label="Move up"
                        >
                          <ArrowUpIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => move(item, 1)}
                          disabled={update.isPending}
                          className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 disabled:opacity-40"
                          aria-label="Move down"
                        >
                          <ArrowDownIcon className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      {item.isLocked ? (
                        <span className="text-[11px] text-ink-400">Always</span>
                      ) : (
                        <button
                          onClick={() => update.mutate({ key: item.key, isActive: !item.isActive })}
                          disabled={update.isPending}
                          className={clsx(
                            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold transition',
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-ink-100 text-ink-500 hover:bg-ink-200',
                          )}
                        >
                          {item.isActive ? (
                            <EyeIcon className="h-3.5 w-3.5" />
                          ) : (
                            <EyeSlashIcon className="h-3.5 w-3.5" />
                          )}
                          {item.isActive ? 'Live' : 'Retired'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {update.isPending && (
          <p className="flex items-center gap-2 border-t border-ink-100 px-5 py-3 text-xs text-ink-500">
            <Spinner /> Saving…
          </p>
        )}
      </section>

      {editing && (
        <MenuLabelEditor
          item={menus.find((m) => m.key === editing)!}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

/** Wording and icon for one row. */
function MenuLabelEditor({ item, onClose }: { item: ISuperAdminMenu; onClose: () => void }) {
  const update = useUpdateMenu()

  const [label, setLabel] = useState(item.label)
  const [labelNe, setLabelNe] = useState(item.labelNe)
  const [icon, setIcon] = useState(item.icon)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate({ key: item.key, label, labelNe, icon }, { onSuccess: onClose })
  }

  const Preview = iconFor(icon)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-12 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-base font-bold text-ink-900">Edit “{item.label}”</h2>
        <p className="mt-0.5 text-xs text-ink-400">
          Changes apply to every company on the platform.
        </p>

        <label className="mt-5 block text-xs font-semibold text-ink-600">English label</label>
        <input className="input mt-1.5" value={label} onChange={(e) => setLabel(e.target.value)} />

        <label className="mt-4 block text-xs font-semibold text-ink-600">Nepali label</label>
        <input
          className="input mt-1.5"
          value={labelNe}
          onChange={(e) => setLabelNe(e.target.value)}
          placeholder="Falls back to the English one if left blank"
        />

        <label className="mt-4 block text-xs font-semibold text-ink-600">Icon</label>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-100">
            <Preview className="h-5 w-5 text-ink-600" />
          </span>
          <select className="input" value={icon} onChange={(e) => setIcon(e.target.value)}>
            {ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-ink-100 pt-5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={update.isPending}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={update.isPending}>
            {update.isPending && <Spinner />} Save
          </button>
        </div>
      </form>
    </div>
  )
}
