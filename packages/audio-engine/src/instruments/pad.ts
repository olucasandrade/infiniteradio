import { midiToFrequency } from '@infinite-radio/shared'

import { applyEnvelope, type AdsrEnvelope } from '../effects/envelope'
import type { Instrument, VoiceHandle } from './types'
import { buildVoiceHandle } from './noise'

const PAD_ENVELOPE: AdsrEnvelope = {
  attack: 1.6,
  decay: 1.2,
  sustain: 0.75,
  release: 2.8,
}

const DRONE_ENVELOPE: AdsrEnvelope = {
  attack: 3.5,
  decay: 2,
  sustain: 0.9,
  release: 4.5,
}

function startOsc(
  ctx: BaseAudioContext,
  type: OscillatorType,
  frequency: number,
  detune: number,
): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = frequency
  osc.detune.value = detune
  return osc
}

/**
 * SynthPad: two detuned saws plus a sub sine an octave down, through a
 * velocity-sensitive lowpass. Long envelope — the pad breathes rather
 * than articulates.
 */
export const synthPadInstrument: Instrument = {
  id: 'synth-pad',
  trigger(ctx, trigger): VoiceHandle {
    const frequency = midiToFrequency(trigger.pitch ?? 60)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 500 + trigger.velocity * 900
    filter.Q.value = 0.6

    const amp = ctx.createGain()
    const peak = 0.16 * trigger.velocity
    const endTime = applyEnvelope(amp.gain, trigger.time, peak, trigger.durationSeconds, PAD_ENVELOPE)

    filter.connect(amp)
    amp.connect(trigger.destination)

    const wobble = trigger.parameters?.wobble ?? 0
    const oscA = startOsc(ctx, 'sawtooth', frequency, -7 - wobble * 9)
    const oscB = startOsc(ctx, 'sawtooth', frequency, 7 + wobble * 9)
    const sub = startOsc(ctx, 'sine', frequency / 2, 0)
    const subGain = ctx.createGain()
    subGain.gain.value = 0.5

    oscA.connect(filter)
    oscB.connect(filter)
    sub.connect(subGain)
    subGain.connect(filter)

    oscA.start(trigger.time)
    oscB.start(trigger.time)
    sub.start(trigger.time)
    oscA.stop(endTime)
    oscB.stop(endTime)
    sub.stop(endTime)

    const sources = [oscA, oscB, sub]
    if (wobble > 0.01) {
      const lfo = ctx.createOscillator()
      const depth = ctx.createGain()
      lfo.frequency.value = 0.12 + wobble * 0.38
      depth.gain.value = wobble * 18
      lfo.connect(depth)
      depth.connect(oscA.detune)
      depth.connect(oscB.detune)
      lfo.start(trigger.time)
      lfo.stop(endTime)
      sources.push(lfo)
    }

    return buildVoiceHandle(ctx, sources, [amp], endTime)
  },
}

/**
 * Drone: a pair of slowly beating sines (±5 cents) with a sub octave,
 * extremely long envelope. The harmonic floor of Weightless.
 */
export const droneInstrument: Instrument = {
  id: 'drone',
  trigger(ctx, trigger): VoiceHandle {
    const frequency = midiToFrequency(trigger.pitch ?? 36)
    const amp = ctx.createGain()
    const peak = 0.22 * trigger.velocity
    const endTime = applyEnvelope(amp.gain, trigger.time, peak, trigger.durationSeconds, DRONE_ENVELOPE)

    amp.connect(trigger.destination)

    const oscA = startOsc(ctx, 'sine', frequency, -5)
    const oscB = startOsc(ctx, 'sine', frequency, 5)
    const sub = startOsc(ctx, 'sine', frequency / 2, 0)
    const subGain = ctx.createGain()
    subGain.gain.value = 0.6

    oscA.connect(amp)
    oscB.connect(amp)
    sub.connect(subGain)
    subGain.connect(amp)

    oscA.start(trigger.time)
    oscB.start(trigger.time)
    sub.start(trigger.time)
    oscA.stop(endTime)
    oscB.stop(endTime)
    sub.stop(endTime)

    return buildVoiceHandle(ctx, [oscA, oscB, sub], [amp], endTime)
  },
}
