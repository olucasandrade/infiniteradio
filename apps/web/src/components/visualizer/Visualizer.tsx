import { useEffect, useRef } from 'react'

import { getEngine } from '../../features/listening/engine'
import { usePlayerStore } from '../../stores/playerStore'
import { useSettingsStore } from '../../stores/settingsStore'

/**
 * Radial spectrum ring fed by the engine's AnalyserNode. Bars grow
 * inward from a ring around the artwork (the host positions the canvas
 * over the artwork container, which carries its own padding). The loop
 * runs only while playing and enabled, and renders a single static
 * frame under reduced motion.
 */
export function Visualizer({ suspended = false }: { suspended?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const status = usePlayerStore((state) => state.status)
  const enabled = useSettingsStore((state) => state.visualizerEnabled)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const playing = status === 'playing'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !enabled || suspended) return
    const context = canvas.getContext('2d')
    if (!context) return

    const SIZE = canvas.width
    const CENTER = SIZE / 2
    const BARS = 72
    const EDGE_GAP = 8
    const BAND = 30

    const draw = () => {
      const analyser = getEngine().getAnalyser()
      context.clearRect(0, 0, SIZE, SIZE)

      const data = new Uint8Array(analyser?.frequencyBinCount ?? 0)
      if (analyser && data.length > 0) analyser.getByteFrequencyData(data)

      const step = Math.max(1, Math.floor(data.length / BARS / 2)) // skip airy top bins
      context.lineWidth = 2.5
      context.lineCap = 'round'
      for (let i = 0; i < BARS; i++) {
        const value = data.length > 0 ? data[i * step]! / 255 : 0.06
        const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2
        const outer = CENTER - EDGE_GAP
        const length = 5 + value * (BAND - 6)
        context.strokeStyle = `rgba(34, 211, 238, ${0.22 + value * 0.62})`
        context.beginPath()
        context.moveTo(CENTER + Math.cos(angle) * outer, CENTER + Math.sin(angle) * outer)
        context.lineTo(
          CENTER + Math.cos(angle) * (outer - length),
          CENTER + Math.sin(angle) * (outer - length),
        )
        context.stroke()
      }
    }

    if (!playing || reducedMotion) {
      draw()
      return
    }

    let frame = 0
    const loop = () => {
      draw()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [playing, enabled, reducedMotion, suspended])

  if (!enabled || suspended) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      width={480}
      height={480}
      aria-hidden
      data-testid="visualizer"
    />
  )
}
