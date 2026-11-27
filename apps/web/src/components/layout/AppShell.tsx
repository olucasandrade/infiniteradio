import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { RadioSceneCanvas, type RadioSceneHandle } from '../../features/scene/RadioSceneCanvas'
import { VISUAL_PROFILES } from '../../features/scene/visualProfiles'
import { usePlaybackShortcuts } from '../../features/listening/shortcuts'
import { usePlayerStore } from '../../stores/playerStore'
import { startPersistence } from '../../stores'
import { useSettingsStore } from '../../stores/settingsStore'
import type { TransportVisualState } from '../player/Transport'
import { Header } from '../navigation/Header'
import { RadioStage } from '../player/RadioStage'
import { SessionDock, type SheetMode } from '../session/SessionDock'
import { SessionSheet } from '../session/SessionSheet'

/**
 * Full-viewport shell of the single-screen radio: an immersive PixiJS 3D
 * signal environment behind one centered transport, with three session
 * actions along the bottom. The station palette drives the active signal
 * color for both the 3D scene and the CSS fallback layers.
 */
export function AppShell({ children }: { children?: ReactNode }) {
  const [sheet, setSheet] = useState<SheetMode | null>(null)
  const [sceneActive, setSceneActive] = useState(false)
  const sceneRef = useRef<RadioSceneHandle>(null)
  usePlaybackShortcuts()
  const stationId = usePlayerStore((state) => state.stationId)
  const status = usePlayerStore((state) => state.status)
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)
  const visualizerEnabled = useSettingsStore((state) => state.visualizerEnabled)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const palette = VISUAL_PROFILES[stationId].palette

  useEffect(() => startPersistence(), [])

  const handleTransportRect = useCallback((rect: DOMRectReadOnly) => {
    sceneRef.current?.setTransportRect(rect)
  }, [])
  const handleTransportState = useCallback((state: TransportVisualState) => {
    sceneRef.current?.setTransportState(state)
  }, [])
  const closeSheet = useCallback(() => setSheet(null), [])
  const handleSelectSheet = useCallback(
    (mode: SheetMode) => setSheet((active) => (active === mode ? null : mode)),
    [],
  )

  return (
    <div
      className="signal-theme relative flex h-[100dvh] flex-col overflow-hidden bg-[#05070c]"
      style={
        {
          '--signal-color': palette[0],
          '--signal-color-head': palette[2],
          '--station-wash': `color-mix(in srgb, ${palette[0]} 7%, transparent)`,
        } as CSSProperties
      }
    >
      {/* CSS environment base: near-black with a station-tinted radial lift
          and a faint cool light along the top edge. Sits under the canvas. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 62% 54% at 50% 46%, var(--station-wash), transparent 72%),' +
            'radial-gradient(ellipse 90% 32% at 50% -8%, rgba(120,150,200,.07), transparent 70%),' +
            '#05070c',
        }}
      />

      <RadioSceneCanvas
        ref={sceneRef}
        stationId={stationId}
        playback={status}
        volume={volume}
        muted={muted}
        reducedMotion={reducedMotion}
        enabled={visualizerEnabled}
        onActiveChange={setSceneActive}
      />

      <Header />

      <main className="relative z-10 grid min-h-0 flex-1 place-items-center px-4">
        <RadioStage
          sceneActive={sceneActive}
          onTransportRectChange={handleTransportRect}
          onTransportStateChange={handleTransportState}
        />
        {children}
      </main>

      <SessionDock active={sheet} onSelect={handleSelectSheet} />
      <SessionSheet mode={sheet} onClose={closeSheet} />
    </div>
  )
}
