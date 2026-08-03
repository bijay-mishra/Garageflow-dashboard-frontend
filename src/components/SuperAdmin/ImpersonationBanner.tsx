import { useQueryClient } from '@tanstack/react-query'
import { ArrowUturnLeftIcon, EyeIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/context/AuthContext'
import { endImpersonation, getImpersonatedCompany } from '@/lib/authStorage'

/**
 * "You are viewing someone else's workshop", and the way out.
 *
 * Impossible to miss on purpose. Everything below it looks exactly like the
 * operator's own dashboard would — that is the design, so support sees what the
 * workshop sees — which means the only thing standing between them and editing a
 * real customer's record in the belief it is a demo is this strip.
 *
 * It is also the only route back. The operator's session was replaced by the
 * company's, so /superadmin refuses the token they now hold; leaving has to
 * happen here, where the parked session can be restored.
 */
export default function ImpersonationBanner() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const company = getImpersonatedCompany()
  if (!company) return null

  const leave = () => {
    const restored = endImpersonation()

    // Nothing cached belongs to the operator's session. Cleared before the
    // reload so no request goes out under the company's token on the way.
    queryClient.clear()

    // A full load rather than a route change, for the same reason entering was:
    // every context in the tree was built for the company's session.
    window.location.href = restored ? '/superadmin/companies' : '/superadmin'
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-500 px-4 py-2 text-center text-amber-950">
      <EyeIcon className="h-4 w-4 shrink-0" />

      <p className="text-xs font-semibold">
        Viewing <span className="font-bold">{user?.workshop ?? company}</span> as an administrator.
        <span className="ml-1.5 font-normal opacity-80">
          Anything you change here is their real data.
        </span>
      </p>

      <button
        onClick={leave}
        className="flex items-center gap-1.5 rounded-md bg-amber-950/15 px-2.5 py-1 text-xs font-bold transition hover:bg-amber-950/25"
      >
        <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
        Exit to console
      </button>
    </div>
  )
}
