import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../utils/cn'

export type HeadingLevel = 1 | 2 | 3 | 4

const levelClasses: Record<HeadingLevel, string> = {
  1: 'text-h1',
  2: 'text-h2',
  3: 'text-h3',
  4: 'text-body-lg',
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
  children: ReactNode
}

export function Heading({ level = 2, className, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const
  return (
    <Tag
      className={cn('font-sans font-medium tracking-tight text-text-primary', levelClasses[level], className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
