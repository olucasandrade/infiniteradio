import type { ReactNode } from 'react'

/** Visually hidden but available to screen readers. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return (
    <span className="absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)] [clip-path:inset(50%)]">
      {children}
    </span>
  )
}
