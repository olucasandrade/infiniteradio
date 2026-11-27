import { useCallback, useMemo, useRef, useState } from 'react'
import { Volume2, VolumeX } from '@infinite-radio/design-system'

import {
  pointerAngleToVolume,
  quantizeVolume,
  volumeToPoint,
  VOLUME_TICK_COUNT,
} from '../../features/scene/volumeArc'

export interface CircularVolumeProps {
  volume: number
  muted: boolean
  sceneActive: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
}

const VIEWBOX = 100
const CENTER = { x: VIEWBOX / 2, y: VIEWBOX / 2 }
const ARC_RADIUS = 44
/** Full length of the 300° arc at radius 44 in viewBox units. */
const ARC_LENGTH = (2 * Math.PI * ARC_RADIUS * 300) / 360
const SEGMENT_LENGTH = ARC_LENGTH / VOLUME_TICK_COUNT

function arcPath(): string {
  const start = volumeToPoint(0, ARC_RADIUS, CENTER)
  const end = volumeToPoint(1, ARC_RADIUS, CENTER)
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${ARC_RADIUS} ${ARC_RADIUS} 0 1 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`
}

/**
 * Circular volume control wrapped around the play/pause orb. The visible
 * ring is drawn by the PixiJS scene; this layer supplies the accessible
 * range input (keyboard), the pointer-arc hit target, and a CSS fallback
 * ring that shows only while the 3D scene is unavailable.
 */
export function CircularVolume({
  volume,
  muted,
  sceneActive,
  onVolumeChange,
  onToggleMute,
}: CircularVolumeProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<number | undefined>(undefined)
  const [interacting, setInteracting] = useState(false)

  const path = useMemo(arcPath, [])
  const activeSegments = quantizeVolume(muted ? 0 : volume)
  const mainLength = Math.max(0, activeSegments - 1) * SEGMENT_LENGTH
  const headLength = activeSegments > 0 ? SEGMENT_LENGTH : 0

  const showReadout = useCallback(() => {
    window.clearTimeout(hideTimer.current)
    setInteracting(true)
  }, [])

  const scheduleHideReadout = useCallback(() => {
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setInteracting(false), 900)
  }, [])

  const volumeFromPointer = useCallback((event: React.PointerEvent): number | null => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return null
    return pointerAngleToVolume(event.clientX, event.clientY, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }, [])

  const handlePointerDown = (event: React.PointerEvent<SVGPathElement>) => {
    if (event.button !== 0) return
    const next = volumeFromPointer(event)
    if (next === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    showReadout()
    onVolumeChange(next)
  }

  const handlePointerMove = (event: React.PointerEvent<SVGPathElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const next = volumeFromPointer(event)
    if (next === null) return
    showReadout()
    onVolumeChange(next)
  }

  const handlePointerUp = (event: React.PointerEvent<SVGPathElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    scheduleHideReadout()
  }

  const value = Math.round((muted ? 0 : volume) * 100)

  return (
    <div ref={stageRef} className="absolute inset-0">
      <svg
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* Pointer hit target: transparent stroke covering the orbit band. */}
        <path
          d={path}
          fill="none"
          stroke="#000"
          strokeOpacity={0}
          strokeWidth={11}
          strokeLinecap="round"
          className="cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onLostPointerCapture={scheduleHideReadout}
        />
        {/* CSS fallback ring — hidden once the PixiJS orbit is rendering. */}
        {!sceneActive && (
          <g>
            <path
              d={path}
              fill="none"
              stroke="rgba(160,180,210,.14)"
              strokeWidth={5}
              strokeLinecap="round"
            />
            <path
              d={path}
              fill="none"
              stroke="var(--signal-color)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`${mainLength} ${ARC_LENGTH}`}
            />
            <path
              d={path}
              fill="none"
              stroke="var(--signal-color-head)"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={`0 ${mainLength} ${headLength} ${ARC_LENGTH - mainLength - headLength}`}
            />
          </g>
        )}
      </svg>

      {/* Semantic volume: keyboard-operable range, visually transparent. */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label="Volume"
        aria-valuetext={`${value} percent`}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (muted && next > 0) onToggleMute()
          onVolumeChange(next / 100)
        }}
        onFocus={showReadout}
        onBlur={scheduleHideReadout}
        className="peer pointer-events-none absolute inset-0 h-full w-full cursor-default opacity-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[34%] rounded-full border-2 border-accent opacity-0 transition-opacity duration-fast peer-focus-visible:opacity-100"
      />

      <output
        aria-hidden
        data-visible={interacting || undefined}
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-micro uppercase tracking-[0.12em] text-text-secondary opacity-0 transition-opacity duration-normal data-[visible]:opacity-100"
      >
        Volume {value}%
      </output>

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        className="absolute left-1/2 top-[80%] inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-[transform,color] duration-fast hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.95]"
      >
        {muted ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
      </button>
    </div>
  )
}
