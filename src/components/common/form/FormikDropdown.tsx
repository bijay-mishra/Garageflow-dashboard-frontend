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
  /**
   * Other fields this choice decides — for cascading selects.
   *
   * Returns a patch rather than writing them itself, and that is the whole
   * point of the signature. Formik's `setFieldValue` validates against
   * `state.values` as it stood at the last render, so two of them fired from
   * one handler both validate against the *original* values: the second call
   * re-runs the schema on a form where this dropdown is still empty, and
   * writes "…is required" back over the error the first call had just
   * cleared. The field is set, the red text stays, and nothing shifts it until
   * some other field is touched.
   *
   * Returning the patch lets both changes go in through a single `setValues`,
   * which validates the finished object once.
   */
  onSelect?: (
    value: string | number | null,
    option: Option | null,
  ) => Record<string, unknown> | void
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
        // One write, so the schema runs once against the whole new form. See
        // the note on `onSelect` for what the two-call version did.
        const cascade = onSelect?.(value, option) ?? {}

        formik.setValues({ ...formik.values, [name]: value ?? '', ...cascade })
        formik.setFieldTouched(name, true, false)
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
