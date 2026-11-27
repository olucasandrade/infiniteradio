import type { HTMLAttributes } from 'react'

import { cn } from '../utils/cn'
import { Surface } from './Surface'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <Surface className={cn('p-4', className)} {...rest} />
}
