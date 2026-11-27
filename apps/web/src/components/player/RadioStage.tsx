import { useEffect, useRef } from 'react'
import { getMood, getStation } from '@infinite-radio/stations'

import { usePlayerStore } from '../../stores/playerStore'
import { PlaybackStatus } from './PlaybackStatus'
import { Transport, type TransportVisualState } from './Transport'

export interface RadioStageProps {
  sceneActive: boolean
  onTransportRectChange: (rect: DOMRectReadOnly) => void
  onTransportStateChange: (state: TransportVisualState) => void
}

/**
 * Centered stack of the single-screen radio: station identity, the
 * transport stage, and the live status. The stage wrapper's bounding rect
 * is reported to the 3D scene so the PixiJS transport aligns with the
 * semantic HTML hit targets beneath it.
 */
export function RadioStage({
  sceneActive,
  onTransportRectChange,
  onTransportStateChange,
}: RadioStageProps) {
  const stationId = usePlayerStore((state) => state.stationId)
  const moodId = usePlayerStore((state) => state.moodByStation[stationId])
  const status = usePlayerStore((state) => state.status)
  const station = getStation(stationId)
  const mood = getMood(station, moodId ?? station.defaultMood)
  const stageRef = useRef<HTMLDivElement>(null)
  const rectCallback = useRef(onTransportRectChange)
  rectCallback.current = onTransportRectChange

  useEffect(() => {
    const node = stageRef.current
    if (!node) return
    const report = () => rectCallback.current(node.getBoundingClientRect())
    report()
    const observer = new ResizeObserver(report)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section aria-label="Player" className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-[clamp(1.25rem,1rem+1.1vw,1.75rem)] font-medium tracking-[0.02em] text-text-primary">
          {station.name}
        </h1>
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-text-muted">
          {mood.name}
        </p>
      </div>

      <div ref={stageRef} className="transport-stage grid place-items-center">
        <Transport sceneActive={sceneActive} onVisualStateChange={onTransportStateChange} />
      </div>

      <PlaybackStatus status={status} />
    </section>
  )
}
