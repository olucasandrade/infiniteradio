import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { PlaybackStatus, StationId } from '@infinite-radio/shared'

import { getEngine } from '../listening/engine'
import type { RadioSceneController, TransportVisualState } from './radioScene'

export interface RadioSceneHandle {
  setTransportRect(rect: DOMRectReadOnly): void
  setTransportState(state: TransportVisualState): void
}

export interface RadioSceneCanvasProps {
  stationId: StationId
  playback: PlaybackStatus
  volume: number
  muted: boolean
  reducedMotion: boolean
  enabled: boolean
  onActiveChange: (active: boolean) => void
}

/**
 * Lazy host for the PixiJS 3D signal scene. The heavy scene module is
 * dynamically imported only while visuals are enabled; the controller is
 * created once and updated in place from React props. Transport rect and
 * visual state flow through the imperative handle so pointer-driven changes
 * never re-render the tree.
 */
export const RadioSceneCanvas = forwardRef<RadioSceneHandle, RadioSceneCanvasProps>(
  function RadioSceneCanvas(
    { stationId, playback, volume, muted, reducedMotion, enabled, onActiveChange },
    ref,
  ) {
    const hostRef = useRef<HTMLDivElement>(null)
    const controllerRef = useRef<RadioSceneController | null>(null)
    const pendingRect = useRef<DOMRectReadOnly | null>(null)
    const pendingState = useRef<TransportVisualState>('idle')
    const latest = useRef({ stationId, playback, volume, muted, reducedMotion })
    latest.current = { stationId, playback, volume, muted, reducedMotion }
    const [failed, setFailed] = useState(false)

    useEffect(() => {
      if (!enabled || failed || !hostRef.current) return
      let cancelled = false
      const host = hostRef.current

      void import('./radioScene')
        .then(async ({ createRadioScene }) => {
          if (cancelled) return
          const controller = await createRadioScene(host, {
            ...latest.current,
            getAnalyser: () => getEngine().getAnalyser(),
            onContextLost: () => {
              if (!cancelled) setFailed(true)
            },
          })
          if (cancelled) {
            controller.dispose()
            return
          }
          controllerRef.current = controller
          if (pendingRect.current) controller.setTransportRect(pendingRect.current)
          controller.setTransportState(pendingState.current)
          onActiveChange(true)
        })
        .catch(() => {
          if (!cancelled) {
            controllerRef.current = null
            onActiveChange(false)
            setFailed(true)
          }
        })

      return () => {
        cancelled = true
        controllerRef.current?.dispose()
        controllerRef.current = null
        onActiveChange(false)
      }
    }, [enabled, failed, onActiveChange])

    useEffect(() => {
      const controller = controllerRef.current
      if (!controller) return
      controller.setStation(stationId)
      controller.setPlayback(playback)
      controller.setVolume(volume, muted)
      controller.setReducedMotion(reducedMotion)
    }, [stationId, playback, volume, muted, reducedMotion])

    useEffect(() => {
      if (!enabled) setFailed(false)
    }, [enabled])

    useImperativeHandle(
      ref,
      () => ({
        setTransportRect(rect) {
          pendingRect.current = rect
          controllerRef.current?.setTransportRect(rect)
        },
        setTransportState(state) {
          pendingState.current = state
          controllerRef.current?.setTransportState(state)
        },
      }),
      [],
    )

    if (!enabled || failed) return null
    return (
      <div
        ref={hostRef}
        aria-hidden
        data-testid="signal-space"
        className="pointer-events-none fixed inset-0 z-0"
      />
    )
  },
)
