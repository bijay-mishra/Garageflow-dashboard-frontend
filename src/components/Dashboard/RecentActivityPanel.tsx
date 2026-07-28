import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import Panel from '@/components/common/Panel'
import { timeAgo } from '@/lib/format'
import { activityDotClass, type IActivity } from './dashboard-schema'

interface RecentActivityPanelProps {
  activity: IActivity[]
}

/** Latest events, newest first — written by the API as changes are saved. */
export default function RecentActivityPanel({ activity }: RecentActivityPanelProps) {
  return (
    <Panel title="Recent activity" subtitle="Latest events">
      {activity.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-400">Nothing has happened yet.</p>
      ) : (
        <ul className="space-y-4">
          {activity.map((entry) => (
            <li key={entry.id} className="flex gap-3">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityDotClass[entry.kind] ?? 'bg-ink-400'}`}
              />
              <div className="min-w-0">
                <p className="text-sm text-ink-700">{entry.text}</p>
                <p className="text-xs text-ink-400">{timeAgo(entry.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/reports"
        className="mt-4 flex items-center justify-center gap-1 rounded-md bg-ink-50 py-2 text-xs font-semibold text-ink-600 hover:bg-ink-100"
      >
        Open reports <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </Panel>
  )
}
