import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { useLang } from '@/context/LanguageContext'
import type { IMenuItem } from './menu-query'

/**
 * The sidebar as a checkbox list, for one role.
 *
 * Groups collapse. A flat list of every row and every child is taller than a
 * modal can hold, and the children of Settings are not what anyone scrolls past
 * on the way to the row they came to change.
 *
 * Unticking a parent takes its children with it, and ticking a child turns its
 * parent back on. Neither is tidiness — the server drops a group whose children
 * are all hidden, and never draws a child whose parent is, so the other
 * combinations describe states the sidebar cannot render.
 */
export default function RoleMenuTree({
  items,
  value,
  onChange,
  disabled = false,
}: {
  items: IMenuItem[]
  value: Record<string, boolean>
  onChange: (next: Record<string, boolean>) => void
  disabled?: boolean
}) {
  const { lang } = useLang()

  const tree = useMemo(
    () =>
      items
        .filter((m) => !m.parentKey)
        .map((m) => ({ item: m, children: items.filter((c) => c.parentKey === m.key) })),
    [items],
  )

  const [open, setOpen] = useState<Record<string, boolean>>({})

  const label = (item: IMenuItem) => (lang === 'np' ? item.labelNe || item.label : item.label)
  const on = (key: string) => value[key] ?? false

  const toggle = (item: IMenuItem, children: IMenuItem[]) => {
    if (disabled || item.isLocked) return

    const next = !on(item.key)
    const updated = { ...value, [item.key]: next }

    if (!next) for (const child of children) if (!child.isLocked) updated[child.key] = false

    onChange(updated)
  }

  const toggleChild = (child: IMenuItem, parent: IMenuItem) => {
    if (disabled || child.isLocked) return

    const next = !on(child.key)

    onChange({
      ...value,
      [child.key]: next,
      ...(next && !parent.isLocked ? { [parent.key]: true } : {}),
    })
  }

  return (
    <div className="max-h-56 overflow-y-auto rounded-lg border border-ink-100">
      {tree.map(({ item, children }) => {
        const expanded = open[item.key] ?? false
        const shownInside = children.filter((c) => on(c.key)).length

        return (
          <div key={item.key} className="border-b border-ink-50 last:border-b-0">
            <div className="flex items-center">
              <Tick
                item={item}
                checked={on(item.key)}
                disabled={disabled}
                label={label(item)}
                onToggle={() => toggle(item, children)}
              />

              {children.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOpen((o) => ({ ...o, [item.key]: !expanded }))}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label(item)}`}
                  className="flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                >
                  <span className="text-[10px] font-semibold tabular-nums">
                    {shownInside}/{children.length}
                  </span>
                  {expanded ? (
                    <ChevronUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {expanded && children.length > 0 && (
              <div className="ml-6 border-l border-ink-100 pl-1">
                {children.map((child) => (
                  <Tick
                    key={child.key}
                    item={child}
                    checked={on(child.key)}
                    disabled={disabled}
                    label={label(child)}
                    // Faded rather than hidden when the group above is off: it
                    // is still a real choice, it just has no effect until the
                    // group comes back on.
                    muted={!on(item.key)}
                    onToggle={() => toggleChild(child, item)}
                    nested
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Tick({
  item,
  checked,
  disabled,
  label,
  onToggle,
  muted = false,
  nested = false,
}: {
  item: IMenuItem
  checked: boolean
  disabled: boolean
  label: string
  onToggle: () => void
  muted?: boolean
  nested?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || item.isLocked}
      aria-pressed={checked}
      className={clsx(
        'flex min-w-0 flex-1 items-center gap-2.5 px-3 py-1.5 text-left transition',
        !disabled && !item.isLocked ? 'hover:bg-ink-50' : 'cursor-default',
        muted && 'opacity-45',
      )}
    >
      <span
        className={clsx(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] transition',
          item.isLocked
            ? 'bg-ink-100 text-ink-400'
            : checked
              ? 'bg-brand-600 text-white'
              : 'bg-white text-transparent ring-1 ring-ink-300',
        )}
      >
        {item.isLocked ? (
          <LockClosedIcon className="h-2.5 w-2.5" />
        ) : (
          <CheckIcon className="h-3 w-3" />
        )}
      </span>

      <span
        className={clsx(
          'flex-1 truncate text-[13px]',
          nested ? 'text-ink-600' : 'font-medium text-ink-800',
        )}
      >
        {label}
      </span>
    </button>
  )
}
