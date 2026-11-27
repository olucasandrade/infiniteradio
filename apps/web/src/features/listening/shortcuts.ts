import { useEffect } from 'react'

import { usePlayerStore } from '../../stores/playerStore'

/** Volume change per arrow-key press. */
const VOLUME_STEP = 0.05

/** Controls that own Space and arrow keys natively when focused. */
const INTERACTIVE_SELECTOR =
  'input, textarea, select, button, [role="slider"], [role="radio"], [role="checkbox"], [contenteditable="true"]'

function ownsKeys(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest(INTERACTIVE_SELECTOR) !== null
}

/**
 * Global playback shortcuts: Space toggles play/pause, arrow keys move the
 * master volume in 5% steps (Up/Right louder, Down/Left quieter). Focused
 * controls keep their native keys — the volume slider, mood radios, and
 * buttons are never overridden — and raising the volume while muted
 * unmutes, matching the slider's behavior.
 */
export function usePlaybackShortcuts(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (ownsKeys(event.target)) return
      const store = usePlayerStore.getState()

      if (event.code === 'Space') {
        if (event.repeat) return
        event.preventDefault()
        void store.togglePlay()
        return
      }

      const delta =
        event.key === 'ArrowUp' || event.key === 'ArrowRight'
          ? VOLUME_STEP
          : event.key === 'ArrowDown' || event.key === 'ArrowLeft'
            ? -VOLUME_STEP
            : 0
      if (delta === 0) return
      event.preventDefault()
      const next = Math.min(1, Math.max(0, store.volume + delta))
      if (store.muted && next > 0) store.toggleMute()
      if (next !== store.volume) store.setVolume(next)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
