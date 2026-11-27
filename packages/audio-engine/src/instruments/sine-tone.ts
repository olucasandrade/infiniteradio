import { midiToFrequency } from '@infinite-radio/shared'

import { applyEnvelope, DEFAULT_ENVELOPE, type AdsrEnvelope } from '../effects/envelope'
import type { Instrument, TriggerContext, VoiceHandle } from './types'

/**
 * Basic single-oscillator voice with an ADSR envelope. Used as the
 * foundation for pads and simple melodic voices.
 */
export function createOscillatorVoice(
  ctx: BaseAudioContext,
  options: {
    type: OscillatorType
    envelope?: AdsrEnvelope
    detuneCents?: number
    peakGain?: number
  },
  trigger: TriggerContext,
): VoiceHandle {
  const osc = ctx.createOscillator()
  osc.type = options.type
  osc.frequency.value = midiToFrequency(trigger.pitch ?? 69)
  osc.detune.value = options.detuneCents ?? 0

  const gain = ctx.createGain()
  const peak = (options.peakGain ?? 0.5) * trigger.velocity
  const endTime = applyEnvelope(
    gain.gain,
    trigger.time,
    peak,
    trigger.durationSeconds,
    options.envelope ?? DEFAULT_ENVELOPE,
  )

  osc.connect(gain)
  gain.connect(trigger.destination)
  osc.start(trigger.time)
  osc.stop(endTime)

  let stopped = false
  return {
    endTime,
    stop() {
      if (stopped) return
      stopped = true
      const now = ctx.currentTime
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setTargetAtTime(0.0001, now, 0.02)
        osc.stop(now + 0.1)
      } catch {
        // Oscillator already ended; nothing to cancel.
      }
    },
  }
}

/** Simple sine instrument: the engine's "can we make sound at all" voice. */
export const sineToneInstrument: Instrument = {
  id: 'bell',
  trigger(ctx, trigger) {
    return createOscillatorVoice(ctx, { type: 'sine', peakGain: 0.6 }, trigger)
  },
}

