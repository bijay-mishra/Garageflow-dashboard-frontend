import type { FormikProps } from 'formik'
import Dropdown, { type Option } from './Dropdown'

interface FormikDropdownProps {
  /** Field name — used to read value, error and touched state off `formik`. */
  name: string
  formik: FormikProps<any>
  options?: Option[]
  /** Async source — called with the typed term. Use for API-backed lists. */
  loadOptions?: (term: string) => Promise<Option[]>
  label?: string
  placeholder?: string
  isRequired?: boolean
  isClearable?: boolean
  isLoading?: boolean
  disabled?: boolean
  isView?: boolean
  className?: string
  /** Fires after the field is set — for cascading selects. */
  onSelect?: (value: string | number | null, option: Option | null) => void
}

/**
 * Formik binding for the shared {@link Dropdown}. Kept separate so Dropdown
 * itself stays usable outside a form (the global search and table filters use
 * it that way).
 */
export default function FormikDropdown({
  name,
  formik,
  options,
  loadOptions,
  label,
  placeholder,
  isRequired = false,
  isClearable = true,
  isLoading = false,
  disabled = false,
  isView = false,
  className,
  onSelect,
}: FormikDropdownProps) {
  const error = formik.errors[name] as string | undefined
  const showError = Boolean(error) && (Boolean(formik.touched[name]) || formik.submitCount > 0)

  return (
    <Dropdown
      name={name}
      label={label}
      options={options}
      loadOptions={loadOptions}
      value={(formik.values[name] as string | number | null) ?? null}
      onChange={(value, option) => {
        formik.setFieldValue(name, value ?? '')
        formik.setFieldTouched(name, true, false)
        onSelect?.(value, option)
      }}
      placeholder={placeholder}
      isRequired={isRequired}
      isClearable={isClearable}
      isLoading={isLoading}
      disabled={disabled}
      isView={isView}
      error={showError ? error : undefined}
      className={className}
    />
  )
}
