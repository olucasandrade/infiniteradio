import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { X } from '../icons'
import { cn } from '../utils/cn'
import { IconButton } from './IconButton'

export interface ModalProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, label, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocusRef = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    restoreFocusRef.current = document.activeElement
    panelRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (restoreFocusRef.current instanceof HTMLElement) {
        restoreFocusRef.current.focus()
      }
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-overlay animate-fade-in" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-md rounded-lg border border-border bg-surface-elevated p-6 shadow-overlay outline-none',
          className,
        )}
      >
        {children}
        <IconButton
          label="Close"
          icon={<X size={18} />}
          onClick={onClose}
          className="absolute right-3 top-3"
        />
      </div>
    </div>,
    document.body,
  )
}
