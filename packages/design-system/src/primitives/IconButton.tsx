import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

import { cn } from '../utils/cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
  active?: boolean
}

const base =
  'inline-flex h-11 w-11 select-none items-center justify-center rounded-md ' +
  'text-text-secondary transition-[transform,background-color] duration-fast hover:bg-surface hover:text-text-primary ' +
  'active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'disabled:pointer-events-none disabled:opacity-50'

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, active = false, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        base,
        active && 'bg-surface text-accent hover:text-accent',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
})
