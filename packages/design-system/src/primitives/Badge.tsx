import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../utils/cn'

export type BadgeTone = 'neutral' | 'accent'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  children: ReactNode
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-border text-text-secondary',
  accent: 'border-accent/50 text-accent',
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-micro font-medium uppercase tracking-wider',
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
