import { useId } from 'react'

import { cn } from '../utils/cn'
import { Label } from './Label'

export interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  formatValue?: (value: number) => string
  className?: string
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  formatValue = (v) => String(v),
  className,
}: SliderProps) {
  const id = useId()

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="normal-case tracking-normal">
          {label}
        </Label>
        <span aria-hidden className="text-small tabular-nums text-text-muted">
          {formatValue(value)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={formatValue(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'h-6 w-full cursor-pointer [accent-color:var(--color-accent)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />
    </div>
  )
}
