import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/common/Badge'
import { ErrorBlock, LoadingBlock, Spinner } from '@/components/common/loaders/States'
import { ConsoleHeader } from '@/components/SuperAdmin/SuperAdminLayout'
import CompanyEditForm from '@/components/SuperAdmin/CompanyEditForm'
import DeleteCompanyDialog from '@/components/SuperAdmin/DeleteCompanyDialog'
import {
  useGetCompanies,
  useGetImpersonations,
  useGetModules,
  useImpersonate,
  useUpdateCompany,
} from '@/components/SuperAdmin/superadmin-query'
import { formatDate } from '@/lib/format'

/**
 * One company: what it is, what it can reach, and the way in.
 *
 * Everything that changes a company lives here rather than on the list, so the
 * powerful actions are reached deliberately — you have opened this company and
 * can see what it is before you suspend it, edit it or delete it.
 */
export default function CompanyDetail() {
  const { code = '' } = useParams()
  const navigate = useNavigate()

  // Read from the list rather than a per-company endpoint: the console loads it
  // anyway, and one source means the two screens can never disagree.
  const { data: companies = [], isLoading, isError } = useGetCompanies()
  const { data: modules = [] } = useGetModules()
  const { data: audit = [] } = useGetImpersonations()

  const updateCompany = useUpdateCompany()
  const impersonate = useImpersonate()

  const [reason, setReason] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Null means "no unsaved edits — show what the server has". Holding the
  // staged set separately rather than seeding state from the company avoids the
  // usual copy-drifts-from-source bug: when nothing is staged there is no copy.
  const [picked, setPicked] = useState<string[] | null>(null)

  if (isLoading) return <LoadingBlock label="Loading company…" />
  if (isError) return <ErrorBlock />

  const company = companies.find((c) => c.companyCode === code)

  if (!company) {
    return (
      <div className="p-5 lg:p-8">
        <p className="text-sm text-ink-500">No company with code {code}.</p>
        <Link to="/superadmin/companies" className="mt-2 inline-block text-sm font-semibold text-brand-600">
          Back to companies
        </Link>
      </div>
    )
  }

  const visits = audit.filter((a) => a.companyCode === company.companyCode)

  // What the toggles show: the staged set if there is one, otherwise the truth.
  const selected = picked ?? company.enabledModules

  const dirty =
    picked !== null &&
    (picked.length !== company.enabledModules.length ||
      picked.some((m) => !company.enabledModules.includes(m)))

  const toggleModule = (name: string) => {
    setPicked((current) => {
      const base = current ?? company.enabledModules
      return base.includes(name) ? base.filter((m) => m !== name) : [...base, name]
    })
  }

  const saveModules = () => {
    if (!picked) return

    updateCompany.mutate(
      { code: company.companyCode, enabledModules: picked },
      // Back to following the server once it has agreed. Clearing this before
      // the round trip would flash the old set back onto the screen mid-save.
      { onSuccess: () => setPicked(null) },
    )
  }

  return (
    <>
      <ConsoleHeader title={company.name} subtitle={`Company code ${company.companyCode}`}>
        <Link to="/superadmin/companies" className="btn-ghost text-xs">
          <ArrowLeftIcon className="h-4 w-4" /> All companies
        </Link>
      </ConsoleHeader>

      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3 lg:p-8">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink-900">Modules</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              What this company can reach. Turning one off removes it from their menu and the
              server stops answering for it. Customers, vehicles and job cards are always on —
              they are the product, not an add-on.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {modules.map((name) => {
                const on = selected.includes(name)

                return (
                  <button
                    key={name}
                    onClick={() => toggleModule(name)}
                    className={
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition ' +
                      (on
                        ? 'bg-brand-600 text-white hover:bg-brand-700'
                        : 'bg-white text-ink-500 ring-1 ring-ink-200 hover:bg-ink-100')
                    }
                  >
                    {name}
                  </button>
                )
              })}
            </div>

            {/* Nothing is sent until this is clicked. Saving on every toggle
                meant turning three modules off was three separate changes to a
                live company, with no chance to look at the result first and no
                way to change your mind halfway. */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
              <button
                className="btn-primary"
                disabled={!dirty || updateCompany.isPending}
                onClick={saveModules}
              >
                {updateCompany.isPending && <Spinner />} Update modules
              </button>

              {dirty && (
                <>
                  <button
                    className="btn-ghost"
                    disabled={updateCompany.isPending}
                    onClick={() => setPicked(null)}
                  >
                    Cancel
                  </button>
                  <p className="text-xs font-semibold text-amber-600">Unsaved changes</p>
                </>
              )}
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-bold text-ink-900">Details</h2>
              <button className="btn-ghost text-xs" onClick={() => setEditing(true)}>
                <PencilSquareIcon className="h-4 w-4" /> Edit
              </button>
            </div>

            <dl className="mt-3 divide-y divide-ink-100 text-sm">
              <Row label="Trading name" value={company.name} />
              <Row label="Registered name" value={company.legalName || '—'} />
              <Row label="Address" value={company.address || '—'} />
              <Row label="Phone" value={company.phone || '—'} />
              <Row label="Email" value={company.email || '—'} />
              <Row label="Created" value={formatDate(company.createdAt)} />
              <Row
                label="Last active"
                value={company.lastActiveAt ? formatDate(company.lastActiveAt) : 'Never signed in'}
              />
              <Row
                label="Public directory"
                value={company.isListed ? 'Listed to customers' : 'Not listed'}
              />
            </dl>

            <p className="mt-3 text-xs text-ink-400">
              The company code cannot be changed — it is what their staff type at sign-in, and
              changing it would lock every one of them out.
            </p>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink-900">Access log</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              Every time an operator has entered this company.
            </p>

            {visits.length === 0 ? (
              <p className="mt-4 text-sm text-ink-400">Nobody has signed in as this company.</p>
            ) : (
              <ul className="mt-3 divide-y divide-ink-100 text-sm">
                {visits.map((v, i) => (
                  <li key={i} className="flex flex-wrap gap-x-3 py-2">
                    <span className="font-medium text-ink-800">{v.userEmail}</span>
                    <span className="text-ink-400">{formatDate(v.at)}</span>
                    {v.reason && <span className="w-full text-xs text-ink-500">{v.reason}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink-900">Status</h2>
              {company.isActive ? (
                <Badge tone="green">Active</Badge>
              ) : (
                <Badge tone="red">Suspended</Badge>
              )}
            </div>

            <p className="mt-2 text-xs text-ink-400">
              {company.isActive
                ? 'Suspending blocks every sign-in here. Their data is untouched and it can be undone.'
                : 'Nobody at this company can sign in. Their data is still here and reactivating restores it.'}
            </p>

            <button
              className={company.isActive ? 'btn-ghost mt-4 w-full' : 'btn-primary mt-4 w-full'}
              disabled={updateCompany.isPending}
              onClick={() =>
                updateCompany.mutate({ code: company.companyCode, isActive: !company.isActive })
              }
            >
              {updateCompany.isPending && <Spinner />}
              {company.isActive ? 'Suspend company' : 'Reactivate company'}
            </button>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink-900">Sign in as this company</h2>
            <p className="mt-2 text-xs text-ink-400">
              Opens the normal dashboard scoped to {company.name}, with full owner access. This is
              recorded against your account.
            </p>

            <input
              className="input mt-3 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
            />

            <button
              className="btn-primary mt-3 w-full"
              disabled={impersonate.isPending || !company.isActive}
              onClick={() => impersonate.mutate({ code: company.companyCode, reason })}
            >
              {impersonate.isPending && <Spinner />} Open dashboard
            </button>

            {!company.isActive && (
              <p className="mt-2 text-xs text-amber-600">
                Reactivate the company first.
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink-900">Usage</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Stat label="Staff accounts" value={company.userCount} />
              <Stat label="Customers" value={company.customerCount} />
              <Stat label="Job cards" value={company.jobCount} />
              <Stat label="Modules enabled" value={company.enabledModules.length} />
            </dl>
          </section>

          {/* Last on the page and visually apart. Delete is the one action with
              nothing to undo it, so it does not sit among the everyday controls
              where a misclick lives. */}
          <section className="rounded-lg border border-rose-200 bg-rose-50/50 p-5">
            <h2 className="text-sm font-bold text-rose-900">Delete company</h2>

            <p className="mt-2 text-xs text-rose-700/80">
              Erases {company.name} and every customer, vehicle, job card and bill in it. This
              cannot be undone.
            </p>

            {company.isActive ? (
              <p className="mt-3 rounded-md bg-white/70 px-3 py-2 text-xs text-rose-700">
                Suspend the company first. If you are only pausing them, suspending is what you
                want — it blocks sign-in and keeps everything.
              </p>
            ) : (
              <button
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                onClick={() => setDeleting(true)}
              >
                <TrashIcon className="h-4 w-4" /> Delete permanently
              </button>
            )}
          </section>
        </div>
      </div>

      {editing && <CompanyEditForm company={company} onClose={() => setEditing(false)} />}

      {deleting && (
        <DeleteCompanyDialog
          company={company}
          onClose={() => setDeleting(false)}
          onDeleted={() => navigate('/superadmin/companies', { replace: true })}
        />
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2">
      <dt className="w-40 shrink-0 text-ink-400">{label}</dt>
      <dd className="text-ink-900">{value}</dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-base font-bold text-ink-900">{value}</dd>
    </div>
  )
}
