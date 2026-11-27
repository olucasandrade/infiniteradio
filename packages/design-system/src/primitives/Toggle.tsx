import { cn } from '../utils/cn'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'justify-end border-accent bg-accent' : 'justify-start bg-surface-elevated',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mx-0.5 block h-4.5 w-4.5 rounded-full transition-colors duration-fast',
          checked ? 'bg-background' : 'bg-text-muted',
          'h-[18px] w-[18px]',
        )}
      />
    </button>
  )
}
