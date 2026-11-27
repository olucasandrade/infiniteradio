import { midiToFrequency } from '@infinite-radio/shared'

import { applyEnvelope } from '../effects/envelope'
import type { Instrument, VoiceHandle } from './types'
import { buildVoiceHandle } from './noise'

/**
 * Pluck: a sawtooth through a filter that snaps shut — a compact
 * subtractive pluck for arpeggiated synth patterns.
 */
export const pluckInstrument: Instrument = {
  id: 'pluck',
  trigger(ctx, trigger): VoiceHandle {
    const frequency = midiToFrequency(trigger.pitch ?? 60)
    const time = trigger.time

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = frequency

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 2.5
    filter.frequency.setValueAtTime(2800 + trigger.velocity * 1400, time)
    filter.frequency.exponentialRampToValueAtTime(240, time + 0.22)

    const amp = ctx.createGain()
    const peak = 0.32 * trigger.velocity
    const endTime = applyEnvelope(amp.gain, time, peak, trigger.durationSeconds, {
      attack: 0.005,
      decay: 0.22,
      sustain: 0.05,
      release: 0.12,
    })

    osc.connect(filter)
    filter.connect(amp)
    amp.connect(trigger.destination)

    osc.start(time)
    osc.stop(endTime)

    return buildVoiceHandle(ctx, [osc], [amp], endTime)
  },
}
