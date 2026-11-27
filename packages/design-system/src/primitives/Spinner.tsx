import { Loader2 } from 'lucide-react'

import { cn } from '../utils/cn'

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <Loader2
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('h-5 w-5 animate-spin text-text-secondary', className)}
    />
  )
}
