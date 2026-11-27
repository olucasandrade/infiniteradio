import { Pause, Play } from '@infinite-radio/design-system'

import { isAudible } from '../../features/listening/status'
import type { TransportVisualState } from '../../features/scene/transportScene'
import { usePlayerStore } from '../../stores/playerStore'
import { CircularVolume } from './CircularVolume'

export type { TransportVisualState }

export interface TransportProps {
  sceneActive: boolean
  onVisualStateChange: (state: TransportVisualState) => void
}

/**
 * The central transport: one dominant circular play/pause control with the
 * volume orbit wrapped around it and mute in the ring gap. The visible orb
 * is rendered by the PixiJS scene; the HTML layer owns semantics, keyboard
 * access, and a CSS fallback orb while the scene is unavailable.
 */
export function Transport({ sceneActive, onVisualStateChange }: TransportProps) {
  const status = usePlayerStore((state) => state.status)
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)

  const initializing = status === 'initializing'
  const audible = isAudible(status)
  const label = status === 'error' ? 'Try again' : audible ? 'Pause' : 'Play'

  return (
    <div className="transport relative aspect-square w-[var(--transport-size)]">
      {/* Dark radial lift behind the transport; also the no-WebGL backdrop. */}
      <div
        aria-hidden
        className="absolute -inset-[18%] rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(11,16,26,.9), rgba(11,16,26,.45) 62%, transparent 100%)',
        }}
      />

      {/* CSS fallback orb — covered by the 3D orb once the scene is live. */}
      <div
        aria-hidden
        data-hidden={sceneActive || undefined}
        className="absolute left-1/2 top-1/2 aspect-square w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-100 transition-opacity duration-slow data-[hidden]:opacity-0"
        style={{
          background: 'radial-gradient(circle at 34% 30%, #2b3444, #141a24 58%, #0c1017 100%)',
          boxShadow:
            '0 0 44px 4px color-mix(in srgb, var(--signal-color) 22%, transparent), inset 0 1px 0 rgba(255,255,255,.09)',
        }}
      />

      <CircularVolume
        volume={volume}
        muted={muted}
        sceneActive={sceneActive}
        onVolumeChange={(next) => usePlayerStore.getState().setVolume(next)}
        onToggleMute={() => usePlayerStore.getState().toggleMute()}
      />

      <button
        type="button"
        disabled={initializing}
        aria-busy={initializing || undefined}
        aria-label={label}
        onClick={() => {
          const store = usePlayerStore.getState()
          if (status === 'error') void store.play()
          else void store.togglePlay()
        }}
        onPointerEnter={() => onVisualStateChange(initializing ? 'busy' : 'hover')}
        onPointerLeave={() => onVisualStateChange(initializing ? 'busy' : 'idle')}
        onPointerDown={() => onVisualStateChange(initializing ? 'busy' : 'pressed')}
        onPointerUp={() => onVisualStateChange(initializing ? 'busy' : 'hover')}
        className="absolute left-1/2 top-1/2 z-10 inline-flex aspect-square w-[40%] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-text-primary transition-[transform,opacity] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background disabled:cursor-wait disabled:opacity-60 motion-safe:active:scale-[0.97]"
      >
        {audible ? (
          <Pause size={30} fill="currentColor" aria-hidden className="drop-shadow" />
        ) : (
          <Play size={30} fill="currentColor" aria-hidden className="ml-1 drop-shadow" />
        )}
      </button>
    </div>
  )
}
