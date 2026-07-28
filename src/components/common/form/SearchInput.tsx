import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search…' }: SearchInputProps) {
  return (
    <div className="relative w-full sm:w-72">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      {/* h-9 matches Dropdown's trigger, so a search box and the filter
          dropdowns beside it line up exactly. */}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input h-9 pl-10" />
    </div>
  )
}
