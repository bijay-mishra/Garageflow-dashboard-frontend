import { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'
import InvoiceDocument from '@/components/Invoice/InvoiceDocument'
import { useGetInvoicePrint } from '@/components/Invoice/invoice-query'
import { useGetWorkshop } from '@/components/Workshop/workshop-query'
import { ErrorBlock, Spinner } from '@/components/common/loaders/States'

/**
 * Settles once every image on the page has loaded, or given up trying.
 *
 * Resolves on failure as readily as on success: a logo that 404s must not hold
 * the print dialog hostage, and a bill without its mark still has to reach the
 * customer. Capped so a hung request cannot block it either.
 */
async function imagesReady(timeoutMs = 3000) {
  const pending = Array.from(document.images)
    .filter((image) => !image.complete)
    .map(
      (image) =>
        new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        }),
    )

  if (pending.length === 0) return

  await Promise.race([
    Promise.all(pending),
    new Promise((resolve) => window.setTimeout(resolve, timeoutMs)),
  ])
}

/**
 * The printable bill, on its own route.
 *
 * A route rather than a modal so it can be opened in a new tab: printing from a
 * dialog means the billing table underneath is still mounted, and getting the
 * browser to print one and not the other is a fight with stacking contexts that
 * `@media print` should not have to win. Here the page *is* the document.
 *
 * `?auto=1` fires the print dialog once the bill has loaded — that is the path
 * taken by the Print button on the invoice table, so a click goes straight to
 * the printer. Opening the URL by hand shows the preview and waits.
 */
export default function InvoicePrint() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const { data: doc, isLoading, isError } = useGetInvoicePrint(id)

  // The letterhead. Fetched alongside rather than blocking on it — the document
  // falls back to the compiled-in constants for the moment before it lands.
  const { data: workshop, isLoading: loadingWorkshop } = useGetWorkshop()

  // Guards against a second dialog: React StrictMode double-invokes effects in
  // development, and two print windows for one click looks broken.
  const printed = useRef(false)

  useEffect(() => {
    // Waits for the letterhead too. Printing the moment the invoice lands would
    // put the fallback name on paper whenever the workshop request is a beat
    // slower — and nobody re-reads a bill they have already printed.
    if (!doc || loadingWorkshop || printed.current || params.get('auto') !== '1') return

    printed.current = true

    let cancelled = false

    // One frame, so the browser has laid the document out before it is
    // snapshotted. Printing synchronously here can capture a half-styled page.
    const timer = window.setTimeout(async () => {
      // …and the letterhead logo has actually decoded. The workshop query
      // resolving only means the *URL* arrived; the image is a second request,
      // and on a cold cache it loses a 150ms race — which prints a bill with a
      // blank space where the mark should be, silently, once.
      await imagesReady()

      if (!cancelled) window.print()
    }, 150)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [doc, loadingWorkshop, params])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner />
      </div>
    )
  }

  if (isError || !doc) {
    return (
      <div className="mx-auto max-w-lg p-10">
        <ErrorBlock />
        <button className="btn-ghost mt-4" onClick={() => navigate('/billing')}>
          <ArrowLeftIcon className="h-4 w-4" /> Back to billing
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-100 py-6 print:bg-white print:py-0">
      {/* Screen-only toolbar. `print:hidden` keeps it off the paper — the
          document below is the only thing that survives into the printout. */}
      <div className="no-print mx-auto mb-4 flex w-full max-w-[210mm] items-center gap-2 px-4">
        <button className="btn-ghost" onClick={() => navigate('/billing')}>
          <ArrowLeftIcon className="h-4 w-4" /> Billing
        </button>
        <span className="ml-auto text-sm text-ink-500">
          Use the browser's <b className="font-semibold text-ink-700">Save as PDF</b> destination to
          send it instead of printing.
        </span>
        <button className="btn-primary" onClick={() => window.print()}>
          <PrinterIcon className="h-4 w-4" /> Print
        </button>
      </div>

      <div className="mx-auto w-full max-w-[210mm] bg-white shadow-soft print:max-w-none print:shadow-none">
        <InvoiceDocument doc={doc} workshop={workshop} />
      </div>
    </div>
  )
}
