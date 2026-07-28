import { initials } from '@/lib/format'

interface AvatarProps {
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export default function Avatar({ name, color = 'bg-brand-500', size = 'md' }: AvatarProps) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${color} ${sizes[size]}`}>
      {initials(name)}
    </span>
  )
}
