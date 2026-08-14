import { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Badge from '@/components/common/Badge'
import DataTable, { type Column } from '@/components/common/table/DataTable'
import { ErrorBlock, LoadingBlock } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import {
  useGetAppCustomers,
  useGetAppCustomerList,
  type IAppCustomerRow,
} from '@/components/SuperAdmin/superadmin-query'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTableState } from '@/hooks/useTableState'
import { formatDate } from '@/lib/format'

type TabId = 'list' | 'dashboard'

const TABS: { id: TabId; label: string; blurb: string }[] = [
  {
    id: 'list',
    label: 'View list',
    blurb: 'Everyone registered on the mobile app, across every company',
  },
  {
    id: 'dashboard',
    label: 'View dashboard',
    blurb: 'How app sign-ups are growing, and which garages are getting them',
  },
]

/**
 * How many people are actually on the customer app, and who they are.
 *
 * Two tabs rather than one long page. The list is the working screen — looking
 * somebody up by name or email — and the charts are the occasional one. Stacked
 * together, the summary blocks pushed the first row of names off the fold every
 * time, so each is now its own view and the list opens first.
 *
 * The population is `Users` with the Customer role: the row a sign-up creates
 * and the app authorises against, not the workshop's own book of walk-ins.
 *
 * Downloads are absent on purpose. The store knows who installed the app; this
 * server only hears from those who registered. Since nothing in the app works
 * signed-out, an install that never registered is not a user, and showing it
 * would flatter the number rather than inform it.
 */
export default function AppCustomers() {
  const [tab, setTab] = useState<TabId>('list')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  // Back to page 1 whenever the search narrows, or the table would ask for rows
  // past the end of the new result set and look empty.
  const table = useTableState({ pageSize: 20 }, [debouncedSearch])

  // Each tab fetches only what it shows. Nothing here is expensive, but the
  // counts run eight queries and there is no reason to run them for somebody
  // who only ever opens the list.
  const list = useGetAppCustomerList(
    table.toQuery({ search: debouncedSearch || undefined }),
    tab === 'list',
  )
  const summary = useGetAppCustomers(tab === 'dashboard')

  const columns = useMemo<Column<IAppCustomerRow>[]>(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortValue: (r) => r.name,
        render: (r) => <span className="text-ink-700">{r.name || '—'}</span>,
      },
      {
        key: 'email',
        header: 'Email',
        sortValue: (r) => r.email,
        render: (r) => <span className="text-ink-700">{r.email}</span>,
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (r) => <span className="text-ink-700">{r.phone || '—'}</span>,
      },
      {
        key: 'registeredAt',
        header: 'Registered',
        sortValue: (r) => r.registeredAt,
        render: (r) => <span className="text-ink-700">{formatDate(r.registeredAt)}</span>,
      },
      {
        key: 'companies',
        header: 'Garages joined',
        // Not sortable: the server sorts on user columns, and ordering by a
        // list of names would be ordering by whichever happened to come first.
        render: (r) =>
          r.companies.length === 0 ? (
            <Badge tone="gray">None yet</Badge>
          ) : (
            <span className="flex flex-wrap gap-1">
              {r.companies.map((c) => (
                <Badge key={c} tone="blue">
                  {c}
                </Badge>
              ))}
            </span>
          ),
      },
      {
        key: 'lastLoginAt',
        header: 'Last seen',
        sortValue: (r) => r.lastLoginAt ?? '',
        render: (r) =>
          r.neverOpened ? (
            <Badge tone="amber">Never opened</Badge>
          ) : (
            <span className="text-ink-700">{r.lastLoginAt ? formatDate(r.lastLoginAt) : '—'}</span>
          ),
      },
    ],
    [],
  )

  const active = TABS.find((t) => t.id === tab)!

  return (
    <>
      <ConsoleHeader title="App customers" subtitle={active.blurb} />

      <div className="border-b border-ink-200 bg-white px-5 lg:px-8">
        <div className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition',
                tab === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-500 hover:border-ink-200 hover:text-ink-800',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 p-5 lg:p-8">
        {tab === 'list' && (
          <ListTab
            rows={list.data?.list ?? []}
            count={list.data?.count ?? 0}
            columns={columns}
            loading={list.isFetching}
            isError={list.isError}
            search={search}
            onSearch={setSearch}
            state={table.state}
            onStateChange={table.setState}
          />
        )}

        {tab === 'dashboard' && <DashboardTab {...summary} />}
      </div>
    </>
  )
}

// ── The list ─────────────────────────────────────────────────────────────────

function ListTab({
  rows,
  count,
  columns,
  loading,
  isError,
  search,
  onSearch,
  state,
  onStateChange,
}: {
  rows: IAppCustomerRow[]
  count: number
  columns: Column<IAppCustomerRow>[]
  loading: boolean
  isError: boolean
  search: string
  onSearch: (value: string) => void
  state: ReturnType<typeof useTableState>['state']
  onStateChange: ReturnType<typeof useTableState>['setState']
}) {
  if (isError) return <ErrorBlock />

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-ink-900">Registered customers</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Newest first — click a column heading to sort. Name and email are what they signed up
            with.
          </p>
        </div>

        <input
          className="input w-full sm:w-72"
          placeholder="Search name, email or phone…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <DataTable
        serverMode
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        itemLabel="app customers"
        total={count}
        state={state}
        onStateChange={onStateChange}
        loading={loading}
        stickyHeader={false}
        empty={{
          icon: DevicePhoneMobileIcon,
          title: search ? 'Nobody matches that search' : 'No app customers yet',
          message: search
            ? 'Try part of a name, an email address or a phone number.'
            : 'Nobody has registered on the mobile app so far.',
        }}
      />
    </section>
  )
}

// ── The numbers ──────────────────────────────────────────────────────────────

function DashboardTab({
  data: stats,
  isLoading,
  isError,
}: ReturnType<typeof useGetAppCustomers>) {
  if (isLoading) return <LoadingBlock label="Counting app customers…" />
  if (isError || !stats) return <ErrorBlock />

  const activeShare =
    stats.total === 0 ? 0 : Math.round((stats.activeLast30Days / stats.total) * 100)
  const busiestMonth = Math.max(...stats.signupTrend.map((p) => p.count), 0)

  return (
    <>
      <section className="card grid grid-cols-2 divide-ink-100 p-5 sm:grid-cols-4 sm:divide-x">
        <div className="sm:pr-5">
          <div className="flex items-center gap-1.5">
            <DevicePhoneMobileIcon className="h-4 w-4 text-brand-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Registered</p>
          </div>
          <p className="mt-1 text-3xl font-bold tabular-nums text-ink-900">
            {stats.total.toLocaleString()}
          </p>
          {stats.newPrevious30Days > 0 && (
            <p
              className={`mt-0.5 text-xs ${
                stats.growthPct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {stats.growthPct >= 0 ? '▲' : '▼'} {Math.abs(stats.growthPct)}% vs previous 30 days
            </p>
          )}
        </div>

        <Figure
          label="Active 30 days"
          value={stats.activeLast30Days}
          note={`${activeShare}% of everyone`}
        />
        <Figure label="Active 7 days" value={stats.activeLast7Days} />
        <Figure
          label="New this month"
          value={stats.newThisMonth}
          note={`${stats.newThisWeek} in the last 7 days`}
        />
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Sign-ups by month</h2>
        <p className="mt-0.5 text-xs text-ink-400">The last twelve months, oldest first.</p>

        {busiestMonth === 0 ? (
          <p className="py-10 text-center text-sm text-ink-400">
            No sign-ups in the last twelve months.
          </p>
        ) : (
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.signupTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e5e9f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#808da6' }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#808da6' }}
                />
                <Tooltip
                  cursor={{ fill: '#f4f6fa' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 13 }}
                  formatter={(value: number) => [value, 'Sign-ups']}
                />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Only rendered when there is something to act on. A permanent row of
          zeroes trains the eye to skip the panel that matters. */}
      {(stats.neverOpened > 0 || stats.notJoinedAnyGarage > 0 || stats.pendingDeletion > 0) && (
        <section className="card p-5">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-ink-900">Worth a look</h2>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.neverOpened > 0 && (
              <Note
                value={stats.neverOpened}
                label="Never opened the app"
                detail="A workshop created the account and handed over a password nobody has used yet."
              />
            )}
            {stats.notJoinedAnyGarage > 0 && (
              <Note
                value={stats.notJoinedAnyGarage}
                label="No garage joined"
                detail="Registered, but has not picked a workshop — so the app has nothing to show them."
              />
            )}
            {stats.pendingDeletion > 0 && (
              <Note
                value={stats.pendingDeletion}
                label="Asked to be deleted"
                detail="Inside the 30-day grace period. Signing in again cancels it."
              />
            )}
          </dl>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-bold text-ink-900">By company</h2>
          <p className="mt-0.5 text-xs text-ink-400">
            Counted by the first garage each customer joined, so these add up to the total rather
            than double-counting anyone who uses two.
          </p>
        </div>

        {stats.byCompany.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-400">
            Nobody has joined a garage from the app yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-5 py-2.5">Company</th>
                  <th className="px-5 py-2.5 text-right">Registered</th>
                  <th className="px-5 py-2.5 text-right">Active (30 days)</th>
                  <th className="px-5 py-2.5 text-right">Share active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {stats.byCompany.map((c) => (
                  <tr key={c.companyCode} className="hover:bg-ink-50/50">
                    <td className="px-5 py-2 text-ink-700">
                      {c.name}{' '}
                      <code className="ml-1 rounded bg-ink-100 px-1.5 py-0.5 text-[11px] text-ink-500">
                        {c.companyCode}
                      </code>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-ink-700">
                      {c.registered}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-ink-700">
                      {c.activeLast30Days}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-ink-700">
                      {c.registered === 0
                        ? '—'
                        : `${Math.round((c.activeLast30Days / c.registered) * 100)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-ink-400">
        Downloads are not shown because this server cannot know them — only Google Play and the App
        Store can. Registering is required to use the app, so the total above is the real user base.
      </p>
    </>
  )
}

/** One number in the summary strip. No icon — four of them read as clutter. */
function Figure({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-ink-900">{value.toLocaleString()}</p>
      {note && <p className="mt-0.5 text-xs text-ink-400">{note}</p>}
    </div>
  )
}

function Note({ value, label, detail }: { value: number; label: string; detail: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-1 text-xl font-bold tabular-nums text-ink-900">{value}</dd>
      <p className="mt-1 text-xs text-ink-400">{detail}</p>
    </div>
  )
}
