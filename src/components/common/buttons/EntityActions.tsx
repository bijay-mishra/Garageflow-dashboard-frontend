import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useConfirm } from '@/context/ConfirmContext'

interface EntityActionsProps {
  onEdit: () => void
  onDelete: () => void
  label?: string
  className?: string
}

/** Compact edit + delete icon buttons for table rows and cards. */
export default function EntityActions({ onEdit, onDelete, label, className = '' }: EntityActionsProps) {
  const confirm = useConfirm()
  const confirmDelete = async () => {
    const ok = await confirm({
      title: 'Delete record?',
      message: `Delete ${label ?? 'this record'}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) onDelete()
  }
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button onClick={onEdit} aria-label="Edit" title="Edit" className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600">
        <PencilSquareIcon className="h-4 w-4" />
      </button>
      <button onClick={confirmDelete} aria-label="Delete" title="Delete" className="rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-rose-500">
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
