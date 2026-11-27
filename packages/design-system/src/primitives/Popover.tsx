import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '../utils/cn'

export interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'end'
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({
  trigger,
  children,
  align = 'end',
  className,
  open: openControlled,
  onOpenChange,
}: PopoverProps) {
  const [openInternal, setOpenInternal] = useState(false)
  const open = openControlled ?? openInternal
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenInternal(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  return (
    <div ref={rootRef} className="relative inline-block">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-30 mt-2 min-w-56 rounded-md border border-border bg-surface-elevated p-4 shadow-overlay animate-fade-in',
            align === 'end' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
