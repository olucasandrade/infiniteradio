import { midiToFrequency } from '@infinite-radio/shared'

import { applyEnvelope, type AdsrEnvelope } from '../effects/envelope'
import type { Instrument, VoiceHandle } from './types'
import { buildVoiceHandle } from './noise'

/**
 * SoftBass: triangle wave with a warm lowpass — the mellow upright-style
 * bass of Blue Notes. Articulate attack, gentle release.
 */
export const softBassInstrument: Instrument = {
  id: 'soft-bass',
  trigger(ctx, trigger): VoiceHandle {
    const frequency = midiToFrequency(trigger.pitch ?? 36)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 320 + trigger.velocity * 260
    filter.Q.value = 0.5

    const amp = ctx.createGain()
    const envelope: AdsrEnvelope = {
      attack: 0.015,
      decay: 0.12,
      sustain: 0.7,
      release: 0.18,
    }
    const peak = 0.5 * trigger.velocity
    const endTime = applyEnvelope(amp.gain, trigger.time, peak, trigger.durationSeconds, envelope)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = frequency

    osc.connect(filter)
    filter.connect(amp)
    amp.connect(trigger.destination)

    osc.start(trigger.time)
    osc.stop(endTime)

    return buildVoiceHandle(ctx, [osc], [amp], endTime)
  },
}

/**
 * SubBass: pure sine, deep and sustained. After Hours' low end.
 */
export const subBassInstrument: Instrument = {
  id: 'sub-bass',
  trigger(ctx, trigger): VoiceHandle {
    const frequency = midiToFrequency(trigger.pitch ?? 33)
    const amp = ctx.createGain()
    const envelope: AdsrEnvelope = {
      attack: 0.03,
      decay: 0.2,
      sustain: 0.85,
      release: 0.3,
    }
    const peak = 0.55 * trigger.velocity
    const endTime = applyEnvelope(amp.gain, trigger.time, peak, trigger.durationSeconds, envelope)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency

    osc.connect(amp)
    amp.connect(trigger.destination)

    osc.start(trigger.time)
    osc.stop(endTime)

    return buildVoiceHandle(ctx, [osc], [amp], endTime)
  },
}
