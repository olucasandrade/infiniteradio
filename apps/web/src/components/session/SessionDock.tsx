import { Radio, SlidersHorizontal, Sparkles } from '@infinite-radio/design-system'

export type SheetMode = 'stations' | 'mood' | 'sound'

export interface SessionDockProps {
  active: SheetMode | null
  onSelect: (mode: SheetMode) => void
}

const ACTIONS: { mode: SheetMode; label: string; icon: typeof Radio }[] = [
  { mode: 'stations', label: 'Stations', icon: Radio },
  { mode: 'mood', label: 'Mood', icon: Sparkles },
  { mode: 'sound', label: 'Sound', icon: SlidersHorizontal },
]

/**
 * Three compact session actions along the bottom of the screen. Each opens
 * one shared sheet surface; the active trigger exposes its expanded state.
 */
export function SessionDock({ active, onSelect }: SessionDockProps) {
  return (
    <nav
      aria-label="Session actions"
      className="relative z-10 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3"
    >
      <div className="flex items-center justify-center gap-2.5 sm:gap-3">
        {ACTIONS.map(({ mode, label, icon: Icon }) => {
          const expanded = active === mode
          return (
            <button
              key={mode}
              type="button"
              aria-expanded={expanded}
              aria-controls="session-sheet"
              onClick={() => onSelect(mode)}
              className={
                'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium ' +
                'transition-[transform,border-color] duration-fast hover:-translate-y-px ' +
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
                'active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ' +
                (expanded
                  ? 'border-[rgba(190,215,255,.32)] bg-[rgba(190,215,255,.08)] text-text-primary'
                  : 'border-[rgba(190,215,255,.13)] bg-[rgba(12,17,27,.78)] text-text-secondary hover:border-[rgba(190,215,255,.28)] hover:text-text-primary')
              }
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
