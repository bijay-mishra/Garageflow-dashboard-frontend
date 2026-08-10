import { workshopInfo } from '@/data/seed'
import { formatDate, formatRs } from '@/lib/format'
import { toBs } from '@/lib/nepaliDate'
import type { IWorkshop } from '@/components/Workshop/workshop-query'
import type { IInvoicePrint } from './invoice-schema'

interface InvoiceDocumentProps {
  doc: IInvoicePrint
  /**
   * The shop's own details, from `GET /api/workshop`. Optional so the document
   * still renders while it loads — falling back to the old hardcoded constants
   * rather than printing a bill with a blank letterhead.
   */
  workshop?: IWorkshop | null
}

/**
 * The bill, as it comes out of the printer.
 *
 * Plain semantic markup with no cards, shadows or brand colour — a tax invoice
 * is a document, not a dashboard panel, and the things that make a screen look
 * good make a printout look cheap. Everything is black on white so it survives
 * a mono laser printer, which is what a workshop has.
 *
 * Sizing is in millimetres rather than rem so the layout does not depend on the
 * 14px root font size the rest of the app is built on. `print.css` handles the
 * page box and hides the app chrome; this component only lays out the content,
 * which is what lets the same markup act as the on-screen preview.
 */
export default function InvoiceDocument({ doc, workshop }: InvoiceDocumentProps) {
  const { invoice, payments, lines } = doc

  // Null outside the conversion range, in which case the Gregorian line stands
  // alone rather than the bill carrying a date that is a guess.
  const issuedBs = toBs(invoice.issuedAt)

  // Server record first, then the compiled-in constants. The fallback exists for
  // the moment before the workshop query resolves; a bill with no name on it is
  // worse than a bill with a slightly stale one.
  const shop = {
    legalName: workshop?.legalName || workshopInfo.legalName,
    address: workshop?.address || workshopInfo.address,
    phone: workshop?.phone || workshopInfo.phone,
    pan: workshop?.taxNumber || workshopInfo.pan,
    footer: workshop?.invoiceFooter ?? '',
    // No fallback mark. A bill is better with a bare name than with the
    // product's gear icon on it — that would put GarageFlow's branding on a
    // tax document issued by somebody else.
    logo: workshop?.logoUrl ?? null,
  }

  return (
    <article className="invoice-doc mx-auto bg-white text-black">
      {/* ── Letterhead ───────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-8 border-b-2 border-black pb-4">
        <div className="flex min-w-0 items-start gap-3">
          {/* Sized in millimetres like the rest of the document, and capped in
              height so a wide wordmark and a square badge both sit on the same
              baseline as the name. `object-contain` never crops the artwork. */}
          {shop.logo && (
            <img
              src={shop.logo}
              alt=""
              className="mt-0.5 h-[16mm] w-[16mm] shrink-0 object-contain"
            />
          )}

          <div className="min-w-0">
            <h1 className="text-[15pt] font-bold uppercase tracking-wide">{shop.legalName}</h1>
            <p className="mt-1 text-[9pt] leading-snug">{shop.address}</p>
            <p className="text-[9pt] leading-snug">
              Tel {shop.phone} · PAN {shop.pan}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[13pt] font-bold uppercase tracking-widest">Tax Invoice</p>
          <p className="mt-1 text-[11pt] font-bold">{invoice.id}</p>
          {/* Both calendars, always — whatever the interface language is set
              to. This is the one document that leaves the building: the
              customer reads dates in BS, the tax office wants AD, and a bill
              carrying only one makes somebody convert by hand. */}
          <p className="text-[9pt]">{formatDate(invoice.issuedAt)}</p>
          {issuedBs && (
            <p className="text-[8pt] text-ink-500">
              {issuedBs.day} {issuedBs.monthName} {issuedBs.year} BS
            </p>
          )}
        </div>
      </header>

      {/* ── Who and what ─────────────────────────────────────────────────── */}
      <section className="mt-4 flex justify-between gap-8 text-[9.5pt]">
        <div className="min-w-0">
          <p className="mb-1 text-[8pt] font-bold uppercase tracking-wider">Billed to</p>
          <p className="text-[11pt] font-bold">{invoice.customerName}</p>
          {doc.customerAddress && <p className="leading-snug">{doc.customerAddress}</p>}
          {doc.customerPhone && <p className="leading-snug">{doc.customerPhone}</p>}
          {doc.customerEmail && <p className="leading-snug">{doc.customerEmail}</p>}
        </div>

        <div className="shrink-0 text-right">
          <p className="mb-1 text-[8pt] font-bold uppercase tracking-wider">Vehicle</p>
          <p className="text-[11pt] font-bold">{invoice.vehiclePlate}</p>
          {doc.vehicleLabel && <p className="leading-snug">{doc.vehicleLabel}</p>}
          {doc.odometer > 0 && <p className="leading-snug">{doc.odometer.toLocaleString('en-IN')} km</p>}
          <p className="leading-snug">Job {invoice.jobCardId}</p>
        </div>
      </section>

      {doc.complaint && (
        <section className="mt-4 border-y border-black/20 py-2 text-[9pt]">
          <span className="font-bold">Work carried out: </span>
          {/* Mechanics' notes are appended to the complaint with newlines; those
              have to survive into print or the section reads as one run-on. */}
          <span className="whitespace-pre-line">{doc.complaint}</span>
        </section>
      )}

      {/* ── Itemised work ────────────────────────────────────────────────── */}
      <table className="mt-4 w-full border-collapse text-[9.5pt]">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-1.5 pr-2 font-bold">#</th>
            <th className="py-1.5 pr-2 font-bold">Description</th>
            <th className="py-1.5 pr-2 text-right font-bold">Qty</th>
            <th className="py-1.5 pr-2 text-right font-bold">Rate</th>
            <th className="py-1.5 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="border-b border-black/15">
              <td className="py-1.5 pr-2 align-top tabular-nums">{index + 1}</td>
              <td className="py-1.5 pr-2 align-top">
                {line.description}
                {/* The kind is worth printing: a customer querying a bill wants
                    to know which figure was parts and which was labour. */}
                <span className="ml-1.5 text-[8pt] uppercase tracking-wide text-black/50">
                  {line.kind}
                </span>
              </td>
              <td className="py-1.5 pr-2 text-right align-top tabular-nums">{line.qty}</td>
              <td className="py-1.5 pr-2 text-right align-top tabular-nums">
                {formatRs(line.unitPrice, true)}
              </td>
              <td className="py-1.5 text-right align-top tabular-nums">
                {formatRs(line.qty * line.unitPrice, true)}
              </td>
            </tr>
          ))}

          {lines.length === 0 && (
            <tr className="border-b border-black/15">
              <td colSpan={5} className="py-4 text-center text-[9pt] italic">
                {/* An invoice outlives its job card on purpose, so this is a real
                    state rather than an error — and saying so is better than an
                    empty table nobody can explain to a customer. */}
                {doc.hasJobCard
                  ? 'No items were recorded against this job.'
                  : 'The job card for this invoice is no longer on file. The totals below stand as issued.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Totals ───────────────────────────────────────────────────────── */}
      <section className="mt-4 flex justify-end">
        <table className="w-[68mm] border-collapse text-[9.5pt]">
          <tbody>
            <tr>
              <td className="py-1">Subtotal</td>
              <td className="py-1 text-right tabular-nums">{formatRs(invoice.subtotal, true)}</td>
            </tr>
            {/* Only on bills that carry one, so an ordinary invoice keeps the
                three-line totals block it has always had. The note is printed
                beside the amount because "why is this cheaper?" is a question
                the customer asks at the counter, not one to leave to the
                advisor's memory. */}
            {invoice.discount > 0 && (
              <tr>
                <td className="py-1">
                  Discount
                  {invoice.discountNote && (
                    <span className="block text-[8pt] leading-tight text-ink-500">
                      {invoice.discountNote}
                    </span>
                  )}
                </td>
                <td className="py-1 text-right tabular-nums">
                  −{formatRs(invoice.discount, true)}
                </td>
              </tr>
            )}
            <tr>
              <td className="py-1">
                VAT {(invoice.taxRate * 100).toFixed(invoice.taxRate * 100 % 1 === 0 ? 0 : 2)}%
              </td>
              <td className="py-1 text-right tabular-nums">{formatRs(invoice.tax, true)}</td>
            </tr>
            <tr className="border-y-2 border-black">
              <td className="py-1.5 text-[11pt] font-bold">Total</td>
              <td className="py-1.5 text-right text-[11pt] font-bold tabular-nums">
                {formatRs(invoice.total, true)}
              </td>
            </tr>
            <tr>
              <td className="py-1">Paid</td>
              <td className="py-1 text-right tabular-nums">{formatRs(invoice.paid, true)}</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Balance due</td>
              <td className="py-1 text-right font-bold tabular-nums">{formatRs(invoice.due, true)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Receipts ─────────────────────────────────────────────────────── */}
      {payments.length > 0 && (
        <section className="mt-5 text-[9pt]">
          <p className="mb-1 text-[8pt] font-bold uppercase tracking-wider">Payments received</p>
          <table className="w-full border-collapse">
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-black/15">
                  <td className="py-1">{formatDate(payment.at)}</td>
                  <td className="py-1">{payment.method}</td>
                  <td className="py-1 text-right tabular-nums">{formatRs(payment.amount, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Sign-off ─────────────────────────────────────────────────────── */}
      <footer className="mt-10 flex items-end justify-between gap-8 text-[8.5pt]">
        <div>
          <p className="leading-snug">
            {invoice.status === 'Paid'
              ? 'Paid in full. Thank you for your business.'
              : 'Please settle the balance shown above.'}
          </p>
          {doc.mechanic && <p className="mt-1 text-black/60">Technician: {doc.mechanic}</p>}
          {/* The shop's own words — terms, warranty, whatever they want on it. */}
          {shop.footer && <p className="mt-2 max-w-[95mm] leading-snug text-black/70">{shop.footer}</p>}
          <p className="mt-3 text-black/50">
            This is a computer-generated invoice from GarageFlow.
          </p>
        </div>

        {/* Signature block. Kept even on a paid invoice — a workshop stamps and
            signs the copy it hands over regardless of what it says. */}
        <div className="shrink-0 text-center">
          <div className="h-10 w-[45mm] border-b border-black" />
          <p className="mt-1">Authorised signature</p>
        </div>
      </footer>
    </article>
  )
}
