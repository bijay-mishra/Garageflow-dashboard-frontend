import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

/**
 * The numbers behind the words the dashboard uses.
 *
 * "Overdue", "due soon", "long-standing" all mean something specific, and this
 * is where an operator can find out what. Shown rather than edited, and
 * honestly labelled as such: these are compiled into the API today, so a control
 * here would be a switch wired to nothing — which is worse than a list, because
 * a list does not lie about what it does.
 */
export default function ThresholdsTab() {
  const groups: { title: string; note: string; rows: { label: string; value: string; why: string }[] }[] = [
    {
      title: 'Job cards',
      note: 'What the dashboard counts as needing attention.',
      rows: [
        {
          label: 'Overdue',
          value: 'Promised date in the past',
          why: 'The date the customer was told, not an age in days — a car promised for Friday is not late on Thursday however long it has been in.',
        },
        {
          label: 'Open',
          value: 'Any status but Completed, Delivered or Cancelled',
          why: 'Counted from status rather than a flag, so a job cannot be open and completed at once.',
        },
      ],
    },
    {
      title: 'Bills',
      note: 'When money is treated as late.',
      rows: [
        {
          label: 'Unpaid',
          value: 'Nothing received',
          why: 'Distinct from Partial: a bill with something against it is a conversation already happening.',
        },
        {
          label: 'Partial',
          value: 'Paid is above zero and below the total',
          why: 'Computed from the payments, never stored — a stored status drifts the moment somebody records a payment by another route.',
        },
      ],
    },
    {
      title: 'Sessions',
      note: 'How long a sign-in lasts.',
      rows: [
        { label: 'Access token', value: '15 minutes', why: 'Short, because it cannot be revoked once issued.' },
        { label: 'Refresh token', value: '7 days', why: 'Rotated on every use, so a stolen one is usable once at most.' },
        {
          label: 'Impersonated session',
          value: '15 minutes, no refresh',
          why: 'Deliberately not renewable. An operator inside a company should have to mean it again rather than drift there for a week.',
        },
        { label: 'Password reset link', value: '30 minutes', why: 'Long enough to find the email, short enough to matter if it is forwarded.' },
      ],
    },
  ]

  return (
    <>
      <section className="card p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-amber-50 p-2.5">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink-900">Thresholds</h2>
            <p className="mt-0.5 max-w-2xl text-xs text-ink-500">
              The rules behind the words on every dashboard. These are compiled into the API, so
              they are shown here rather than edited — a control wired to nothing would be worse
              than no control.
            </p>
          </div>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.title} className="card overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="text-sm font-bold text-ink-900">{group.title}</h2>
            <p className="mt-0.5 text-xs text-ink-400">{group.note}</p>
          </div>

          <ul className="divide-y divide-ink-100">
            {group.rows.map((row) => (
              <li key={row.label} className="px-5 py-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-sm font-semibold text-ink-900">{row.label}</span>
                  <span className="rounded bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
                    {row.value}
                  </span>
                </div>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-400">{row.why}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
