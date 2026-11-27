import type { LabelHTMLAttributes, ReactNode } from 'react'

import { cn } from '../utils/cn'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
}

export function Label({ className, children, ...rest }: LabelProps) {
  return (
    <label
      className={cn(
        'text-small font-medium uppercase tracking-wider text-text-secondary',
        className,
      )}
      {...rest}
    >
      {children}
    </label>
  )
}
