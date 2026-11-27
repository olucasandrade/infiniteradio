import type { PlaybackStatus } from '@infinite-radio/shared'
import { WebAudioEngine } from '@infinite-radio/audio-engine'
import { STATIONS } from '@infinite-radio/stations'

/**
 * Engine singleton. The engine owns browser audio objects and therefore
 * lives outside React state; React only talks to it through the stores.
 * The AudioContext itself is not created until initialize() — which the
 * UI only calls from an explicit user gesture.
 */
let engine: WebAudioEngine | null = null
let unsubscribe: (() => void) | null = null
const statusListeners = new Set<(status: PlaybackStatus) => void>()

function attach(instance: WebAudioEngine): void {
  unsubscribe?.()
  unsubscribe = instance.onStatusChange((status) => {
    for (const listener of statusListeners) listener(status)
  })
}

export function getEngine(): WebAudioEngine {
  if (!engine) {
    engine = new WebAudioEngine(STATIONS, { sampleBaseUrl: `${import.meta.env.BASE_URL}samples/` })
    attach(engine)
    // Debug/testing hook: lets e2e tests inspect real playback state.
    ;(globalThis as { __IR_ENGINE__?: WebAudioEngine }).__IR_ENGINE__ = engine
  }
  return engine
}

/** Subscribe to engine status regardless of instance replacement. */
export function onEngineStatus(listener: (status: PlaybackStatus) => void): () => void {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

/** Test hook: replace the singleton (e.g. with a mock). */
export function setEngineForTesting(next: WebAudioEngine | null): void {
  engine = next
  if (next) attach(next)
}
