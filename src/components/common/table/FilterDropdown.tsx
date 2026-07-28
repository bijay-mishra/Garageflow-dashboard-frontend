import Dropdown from '@/components/common/form/Dropdown'

/** The value every table filter uses for "do not filter on this". */
export const ALL = 'All'

interface FilterDropdownProps<T extends string> {
  /**
   * Shown while nothing is chosen — so it names the filter as well as its
   * neutral state, e.g. "All types", "All statuses".
   */
  placeholder: string
  /**
   * The selectable values. `All` is deliberately *not* one of them: it is the
   * cleared state, reached through the dropdown's own clear button.
   */
  options: readonly T[]
  value: T | typeof ALL
  onChange: (value: T | typeof ALL) => void
  /** Widen when the labels are long. */
  className?: string
}

/**
 * A table's filter control.
 *
 * These used to be rows of pills, which cost a line of vertical space per
 * filter and pushed the table down the page once a second filter appeared.
 * A dropdown keeps every filter on the same line as the search box no matter
 * how many values it offers.
 *
 * "All" maps onto the underlying Dropdown's empty state rather than being a
 * real option, so clearing the control and choosing "show everything" are the
 * same gesture.
 */
export default function FilterDropdown<T extends string>({
  placeholder,
  options,
  value,
  onChange,
  className = 'w-full sm:w-40',
}: FilterDropdownProps<T>) {
  return (
    <Dropdown
      className={className}
      placeholder={placeholder}
      value={value === ALL ? null : value}
      onChange={(next) => onChange((next as T | null) ?? ALL)}
      options={options.map((option) => ({ label: option, value: option }))}
      // Short, closed vocabularies — a type-ahead over six words is friction.
      isSearchable={options.length > 8}
    />
  )
}
