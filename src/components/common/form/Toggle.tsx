import clsx from 'clsx'

interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  /** The consequence of switching it on, in a sentence. */
  hint?: string
  disabled?: boolean
  /** Explains *why* it is disabled — a greyed switch with no reason is a dead end. */
  disabledReason?: string
}

/**
 * An on/off setting.
 *
 * A switch rather than a checkbox because these are settings that take effect on
 * save, not items being selected. Every one of them changes something a customer
 * can see, so the hint is not decoration — it is the difference between "listed"
 * meaning nothing and meaning "my address is now public".
 */
export default function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
  disabledReason,
}: ToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors',
          'focus:outline-none focus:ring-4 focus:ring-brand-100',
          checked ? 'bg-brand-600' : 'bg-ink-200',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-800">{label}</p>
        {disabled && disabledReason ? (
          <p className="mt-0.5 text-xs text-amber-600">{disabledReason}</p>
        ) : (
          hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
        )}
      </div>
    </div>
  )
}
