import type { InstrumentId, MusicalEvent } from '@infinite-radio/shared'

/**
 * An instrument converts a musical event into scheduled Web Audio nodes.
 * Voices are created per event and own their nodes; the returned handle
 * lets the scheduler cancel or clean them up.
 */
export interface VoiceHandle {
  /** Cancel the voice as soon as possible (pause/teardown). */
  stop(): void
  /** AudioContext time at which the voice's nodes are fully released. */
  readonly endTime: number
}

export interface TriggerContext {
  destination: AudioNode
  /** AudioContext time of the event start. */
  time: number
  /** Event duration in seconds (already converted from beats). */
  durationSeconds: number
  /** Velocity scaled to 0..1. */
  velocity: number
  pitch?: number
  parameters?: Record<string, number>
}

export interface Instrument {
  readonly id: InstrumentId
  trigger(ctx: BaseAudioContext, event: TriggerContext): VoiceHandle
}

/** Convenience adapter from a MusicalEvent plus its scheduled time. */
export function triggerMusicalEvent(
  audioContext: BaseAudioContext,
  instrument: Instrument,
  destination: AudioNode,
  event: MusicalEvent,
  timeSeconds: number,
  secondsPerBeat: number,
): VoiceHandle {
  return instrument.trigger(audioContext, {
    destination,
    time: timeSeconds,
    durationSeconds: event.duration * secondsPerBeat,
    velocity: event.velocity ?? 0.8,
    pitch: event.pitch,
    parameters: event.parameters,
  })
}
