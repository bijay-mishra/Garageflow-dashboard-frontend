import { useState } from 'react'
import {
  CheckCircleIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { ICompanyCreated } from './superadmin-query'

/**
 * The credentials to hand over, shown once.
 *
 * This screen exists because the password is genuinely unrecoverable: only its
 * hash is stored, and there is no endpoint that returns it. That is the point —
 * an operator who can look it up later is an operator who can sign in as the
 * owner later. The cost is that closing this without copying it means resetting
 * the password, so the screen says so plainly and does not close by accident.
 */
export default function CompanyHandover({
  created,
  onClose,
}: {
  created: ICompanyCreated
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const { company, oneTimePassword } = created

  const lines = [
    `Company code: ${company.companyCode}`,
    `Email: ${company.email}`,
    `Password: ${oneTimePassword}`,
  ].join('\n')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused. The values are on screen to be read.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
        </span>

        <h2 className="mt-4 text-base font-bold text-ink-900">{company.name} is set up</h2>
        <p className="mt-1 text-xs text-ink-500">
          Give these to {company.email}. They will be asked to choose their own password the first
          time they sign in.
        </p>

        <dl className="mt-4 space-y-2 rounded-lg border border-ink-100 bg-ink-50 p-4">
          <Row label="Company code" value={company.companyCode} />
          <Row label="Email" value={company.email} />
          <Row label="Password" value={oneTimePassword} mono />
        </dl>

        <button onClick={copy} className="btn-ghost mt-3 w-full justify-center">
          <ClipboardDocumentIcon className="h-4 w-4" />
          {copied ? 'Copied' : 'Copy all three'}
        </button>

        <p className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          This password is not stored anywhere and cannot be shown again. If you lose it, reset it
          from the company's page.
        </p>

        <button onClick={onClose} className="btn-primary mt-4 w-full justify-center">
          I have written it down
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd
        className={
          mono
            ? 'select-all font-mono text-sm font-bold tracking-wide text-ink-900'
            : 'select-all truncate text-sm font-semibold text-ink-900'
        }
      >
        {value}
      </dd>
    </div>
  )
}
