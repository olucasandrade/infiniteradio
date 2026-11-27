import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'

import { cn } from '../utils/cn'

type CommonProps = {
  label: string
  icon: ReactNode
  active?: boolean
  className?: string
}

export type IconButtonProps = CommonProps &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'>)
    | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>)
  )

const base =
  'inline-flex h-11 w-11 select-none items-center justify-center rounded-md ' +
  'text-text-secondary transition-[transform,background-color] duration-fast hover:bg-surface hover:text-text-primary ' +
  'active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'disabled:pointer-events-none disabled:opacity-50'

export const IconButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(
  function IconButton({ label, icon, active = false, className, href, ...rest }, ref) {
    const classes = cn(
      base,
      active && 'bg-surface text-accent hover:text-accent',
      className,
    )
    if (href) {
      const anchorRest = rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'>
      return (
        <a
          ref={(ref as Ref<HTMLAnchorElement>) ?? undefined}
          href={href}
          aria-label={label}
          className={classes}
          {...anchorRest}
        >
          {icon}
        </a>
      )
    }
    const buttonRest = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>
    return (
      <button
        ref={(ref as Ref<HTMLButtonElement>) ?? undefined}
        type={buttonRest.type ?? 'button'}
        aria-label={label}
        aria-pressed={active}
        className={classes}
        {...buttonRest}
      >
        {icon}
      </button>
    )
  },
)
