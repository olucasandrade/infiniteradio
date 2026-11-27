import { useEffect, useRef } from 'react'
import { Heading, IconButton, Text, X } from '@infinite-radio/design-system'
import { getStation } from '@infinite-radio/stations'

import { usePlayerStore } from '../../stores/playerStore'
import { MoodSelector } from '../customization/MoodSelector'
import { SoundParameters } from './SoundParameters'
import { StationList } from './StationList'
import type { SheetMode } from './SessionDock'

export interface SessionSheetProps {
  mode: SheetMode | null
  onClose: () => void
}

const TITLES: Record<SheetMode, string> = {
  stations: 'Stations',
  mood: 'Mood',
  sound: 'Sound',
}

/**
 * One shared rounded sheet surface for the three session actions. Bottom
 * sheet on mobile, floating panel on desktop. Focus is trapped while open,
 * Escape and scrim click close, and focus returns to the trigger.
 */
export function SessionSheet({ mode, onClose }: SessionSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const stationId = usePlayerStore((state) => state.stationId)
  const station = getStation(stationId)

  useEffect(() => {
    if (!mode) return
    const trigger = document.activeElement
    const panel = panelRef.current
    panel?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (trigger instanceof HTMLElement) trigger.focus()
    }
  }, [mode, onClose])

  if (!mode) return null

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-[rgba(3,5,9,.62)] animate-fade-in"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="session-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-sheet-title"
        tabIndex={-1}
        className={
          'absolute inset-x-0 bottom-0 flex max-h-[min(78dvh,680px)] flex-col overflow-hidden rounded-t-3xl ' +
          'border border-b-0 border-[rgba(190,215,255,.13)] bg-[rgba(10,14,22,.92)] shadow-overlay outline-none ' +
          'animate-[ir-sheet-up_var(--duration-normal)_var(--ease-standard)] ' +
          'lg:inset-x-auto lg:bottom-auto lg:right-5 lg:top-1/2 lg:w-[420px] lg:-translate-y-1/2 lg:rounded-3xl lg:border-b'
        }
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div className="flex flex-col gap-0.5">
            <Heading level={2} id="session-sheet-title">
              {TITLES[mode]}
            </Heading>
            {mode !== 'stations' && (
              <Text variant="small" color="muted">
                {station.name}
              </Text>
            )}
          </div>
          <IconButton label="Close" icon={<X size={18} />} onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-1">
          {mode === 'stations' && <StationList onSelected={onClose} />}
          {mode === 'mood' && (
            <div className="flex flex-col gap-5 pb-2">
              <MoodSelector stationId={stationId} />
              <Text variant="small" color="muted">
                Changes apply to the live transmission immediately.
              </Text>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-full border border-[rgba(190,215,255,.13)] bg-[rgba(12,17,27,.78)] px-5 text-sm font-medium text-text-secondary transition-colors duration-fast hover:border-[rgba(190,215,255,.28)] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Done
              </button>
            </div>
          )}
          {mode === 'sound' && <SoundParameters />}
        </div>
      </div>
    </div>
  )
}
