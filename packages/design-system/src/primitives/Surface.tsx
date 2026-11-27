import type { HTMLAttributes } from 'react'

import { cn } from '../utils/cn'

export function Surface({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-surface', className)}
      {...rest}
    />
  )
}
