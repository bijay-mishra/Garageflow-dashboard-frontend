import { FieldArray, type FormikProps } from 'formik'
import clsx from 'clsx'
import { TrashIcon } from '@heroicons/react/24/outline'
import { formatRs } from '@/lib/format'
import { emptyJobLine, jobLinesTotal, type IJobLine, type JobCardFormType } from './jobcard-schema'

interface JobLinesFieldProps {
  formik: FormikProps<JobCardFormType>
}

/**
 * Parts & labour editor for a job card. Rows are a Formik FieldArray, so
 * validation errors land per row and the running total stays in sync with what
 * the server will compute from the same numbers.
 */
export default function JobLinesField({ formik }: JobLinesFieldProps) {
  const lines = formik.values.lines ?? []
  const showErrors = formik.submitCount > 0

  /** Per-cell error text, once a submit has been attempted. */
  const errorFor = (index: number, field: keyof IJobLine): string | undefined => {
    if (!showErrors) return undefined
    const rowErrors = (formik.errors.lines as Array<Record<string, string>> | undefined)?.[index]
    return rowErrors?.[field]
  }

  const cellClass = (index: number, field: keyof IJobLine, extra: string) =>
    clsx('input', extra, errorFor(index, field) && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100')

  return (
    <FieldArray name="lines">
      {({ push, remove }) => (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-600">Parts &amp; labour</span>
            <button type="button" onClick={() => push({ ...emptyJobLine })} className="btn-soft px-2.5 py-1 text-xs">
              Add line
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-400">
              No parts or labour yet — the job can be costed later.
            </p>
          ) : (
            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2">
                    <input
                      className={cellClass(index, 'description', 'flex-1')}
                      placeholder="Description"
                      aria-label="Description"
                      name={`lines.${index}.description`}
                      value={line.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />

                    <select
                      className="input w-24 shrink-0"
                      aria-label="Kind"
                      name={`lines.${index}.kind`}
                      value={line.kind}
                      onChange={formik.handleChange}
                    >
                      <option value="labour">Labour</option>
                      <option value="part">Part</option>
                    </select>

                    <input
                      className={cellClass(index, 'qty', 'w-16 shrink-0 text-center')}
                      type="number"
                      min={0}
                      step="any"
                      aria-label="Quantity"
                      name={`lines.${index}.qty`}
                      value={line.qty}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />

                    <input
                      className={cellClass(index, 'unitPrice', 'w-24 shrink-0 text-right')}
                      type="number"
                      min={0}
                      step="any"
                      aria-label="Unit price"
                      name={`lines.${index}.unitPrice`}
                      value={line.unitPrice}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-500"
                      aria-label="Remove line"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {showErrors && (
                    <p className="mt-1 pl-1 text-xs font-medium text-rose-600">
                      {errorFor(index, 'description') ?? errorFor(index, 'qty') ?? errorFor(index, 'unitPrice')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex justify-end border-t border-ink-100 pt-3 text-sm">
            <span className="text-ink-400">Estimated total&nbsp;</span>
            <span className="font-bold text-ink-900">{formatRs(jobLinesTotal(lines))}</span>
          </div>
        </div>
      )}
    </FieldArray>
  )
}
