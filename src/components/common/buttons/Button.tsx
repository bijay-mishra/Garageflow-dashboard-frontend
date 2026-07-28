import type { ComponentType, ReactNode } from 'react'
import clsx from 'clsx'
import { Spinner } from '../loaders/States'

export type ButtonVariant = 'primary' | 'ghost' | 'soft' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title?: string
  children?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ComponentType<{ className?: string }>
  disabled?: boolean
  isLoading?: boolean
  fullWidth?: boolean
  className?: string
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-glow hover:bg-brand-700',
  ghost: 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-9 gap-2 px-4 text-sm',
  lg: 'h-10 gap-2 px-5 text-sm',
}

const iconSizes: Record<ButtonSize, string> = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-4 w-4' }

/**
 * The one button in the app. `title` is the label (ERP-style); `children` wins
 * if you pass both, so composed content still works.
 */
export default function Button({
  title,
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  isLoading = false,
  fullWidth = false,
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-semibold transition-all duration-150',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : 'w-auto',
        className,
      )}
    >
      {isLoading ? <Spinner className={iconSizes[size]} /> : Icon && <Icon className={iconSizes[size]} />}
      <span className="truncate">{children ?? title}</span>
    </button>
  )
}
