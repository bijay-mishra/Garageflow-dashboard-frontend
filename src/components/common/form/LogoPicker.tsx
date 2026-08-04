import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import CompanyLogo from '@/components/common/CompanyLogo'
import { Spinner } from '@/components/common/loaders/States'

/**
 * What the server accepts, mirrored here so a doomed upload is refused before it
 * costs a round trip.
 *
 * A mirror is a thing that drifts, so these are stated once and the server's
 * message is what the user sees if they ever disagree — this is a courtesy, not
 * the gate. The real check is `WorkshopController.CheckLogoAsync`.
 */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_BYTES = 1024 * 1024

interface LogoPickerProps {
  /** The stored logo, if any. */
  url?: string | null
  /** Name behind the initials shown when there is no logo. */
  name: string
  /**
   * Chosen. Either uploaded immediately or held by the caller until it has
   * something to attach the file to — see the note on `file` below.
   */
  onPick: (file: File) => void
  /**
   * Removes the stored logo. Omit when there is nothing to remove yet, which
   * hides the button rather than showing one that cannot work.
   */
  onRemove?: () => void
  /**
   * A file chosen but not yet uploaded, previewed over `url`.
   *
   * This is what lets the same control work on the New company form, where
   * there is no company to upload to until the form is submitted. The caller
   * holds the File and posts it once the company exists.
   */
  file?: File | null
  busy?: boolean
  hint?: string
}

/**
 * Picks a company logo: click, or drop a file on it.
 *
 * Deliberately shows the mark at the size it is actually used rather than in a
 * large hero preview. A logo that reads at 80px and turns to mush at 40 is a
 * logo you want to find out about here, not on a printed invoice.
 */
export default function LogoPicker({
  url,
  name,
  onPick,
  onRemove,
  file,
  busy = false,
  hint,
}: LogoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  // A blob URL for the not-yet-uploaded file. Revoked when it changes or the
  // component goes away — these are held by the document until told otherwise,
  // and a settings screen somebody fiddles with would leak one per attempt.
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const accept = (candidate: File | undefined) => {
    if (!candidate) return

    if (!ACCEPTED.includes(candidate.type)) {
      setProblem('Use a PNG, JPG, WebP or SVG.')
      return
    }

    if (candidate.size > MAX_BYTES) {
      setProblem('That image is over 1 MB. A logo should be far smaller than a photo.')
      return
    }

    setProblem(null)
    onPick(candidate)
  }

  const shown = preview ?? url ?? null

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          accept(event.dataTransfer.files?.[0])
        }}
        className={clsx(
          'flex items-center gap-4 rounded-lg border border-dashed p-4 transition',
          dragging ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-ink-50/50',
        )}
      >
        {/* Checkerboard behind the mark, so a white logo on a white card is
            still visibly there and a transparent PNG reads as transparent
            rather than as a missing image. */}
        <span
          className="shrink-0 rounded-lg p-1"
          style={{
            backgroundImage:
              'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),' +
              'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 6px 6px',
          }}
        >
          <CompanyLogo url={shown} name={name} size="xl" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Spinner /> : <ArrowUpTrayIcon className="h-4 w-4" />}
              {shown ? 'Replace' : 'Upload a logo'}
            </button>

            {/* Only offered against something actually stored. A pending file is
                cleared by picking another, and a Remove that silently meant two
                different things would be worse than not having one. */}
            {onRemove && url && !file && (
              <button
                type="button"
                className="btn-ghost text-rose-600 hover:bg-rose-50"
                onClick={() => onRemove()}
                disabled={busy}
              >
                <TrashIcon className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>

          <p className="mt-1.5 text-xs text-ink-400">
            {hint ?? 'PNG, JPG, WebP or SVG, under 1 MB. Drop a file here or click Upload.'}
          </p>

          {file && (
            <p className="mt-1 text-xs font-medium text-brand-700">
              {file.name} — not saved yet.
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={(event) => {
            accept(event.target.files?.[0])
            // Cleared so picking the same file twice still fires a change —
            // which is exactly what somebody does after re-exporting it.
            event.target.value = ''
          }}
        />
      </div>

      {problem && <p className="text-xs font-medium text-rose-600">{problem}</p>}
    </div>
  )
}
