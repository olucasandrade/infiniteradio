import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../utils/cn'

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body-lg'
  | 'body'
  | 'small'
  | 'micro'

export type TextColor = 'primary' | 'secondary' | 'muted' | 'accent'

const variantClasses: Record<TextVariant, string> = {
  display: 'text-display',
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  'body-lg': 'text-body-lg',
  body: 'text-body',
  small: 'text-small',
  micro: 'text-micro',
}

const colorClasses: Record<TextColor, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
  accent: 'text-accent',
}

export interface TextProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TextVariant
  color?: TextColor
  children: ReactNode
}

export function Text({
  variant = 'body',
  color = 'primary',
  className,
  children,
  ...rest
}: TextProps) {
  return (
    <span className={cn(variantClasses[variant], colorClasses[color], className)} {...rest}>
      {children}
    </span>
  )
}
