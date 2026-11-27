import type { HTMLAttributes } from 'react'

import { cn } from '../utils/cn'

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-skeleton-pulse rounded-md bg-surface-elevated', className)}
      {...rest}
    />
  )
}
