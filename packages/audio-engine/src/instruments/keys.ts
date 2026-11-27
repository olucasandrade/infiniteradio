import { midiToFrequency } from '@infinite-radio/shared'

import { applyEnvelope } from '../effects/envelope'
import type { Instrument, TriggerContext, VoiceHandle } from './types'
import { buildVoiceHandle } from './noise'

interface FmVoiceOptions {
  /** Modulator frequency ratio. */
  ratio: number
  /** Modulation index at the note start. */
  index: number
  /** Modulation index at the end (fraction of the start). */
  indexEndRatio: number
  peakGain: number
  /** Optional second partial: [ratio, gain]. */
  partial?: [number, number]
  attack: number
  release: number
}

/**
 * Two-operator FM voice. Shared by the electric piano (tine) and bell:
 * the difference is ratio, index, and envelope shape.
 */
function fmTrigger(
  ctx: BaseAudioContext,
  trigger: TriggerContext,
  options: FmVoiceOptions,
): VoiceHandle {
  const frequency = midiToFrequency(trigger.pitch ?? 60)
  const time = trigger.time
  const duration = trigger.durationSeconds

  const age = trigger.parameters?.age ?? 0
  const carrier = ctx.createOscillator()
  carrier.type = 'sine'
  carrier.frequency.value = frequency
  carrier.detune.value = (age - 0.5) * 7

  const modulator = ctx.createOscillator()
  modulator.type = 'sine'
  modulator.frequency.value = frequency * options.ratio

  const modGain = ctx.createGain()
  const index = options.index * (0.6 + trigger.velocity * 0.6)
  modGain.gain.setValueAtTime(index, time)
  modGain.gain.exponentialRampToValueAtTime(
    Math.max(0.001, index * options.indexEndRatio),
    time + Math.max(0.05, duration),
  )

  const amp = ctx.createGain()
  const peak = options.peakGain * trigger.velocity
  const endTime = applyEnvelope(amp.gain, time, peak, duration, {
    attack: options.attack,
    decay: 0.25,
    sustain: 0.55,
    release: options.release,
  })

  const mix = ctx.createGain()
  modulator.connect(modGain)
  modGain.connect(carrier.frequency)
  carrier.connect(mix)

  if (options.partial) {
    const [partialRatio, partialGain] = options.partial
    const partialOsc = ctx.createOscillator()
    partialOsc.type = 'sine'
    partialOsc.frequency.value = frequency * partialRatio
    const partialAmp = ctx.createGain()
    partialAmp.gain.setValueAtTime(partialGain * trigger.velocity, time)
    partialAmp.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.08, duration * 0.4))
    partialOsc.connect(partialAmp)
    partialAmp.connect(mix)
    partialOsc.start(time)
    partialOsc.stop(endTime)
  }

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 3200 - age * 2100

  mix.connect(filter)
  filter.connect(amp)
  amp.connect(trigger.destination)

  carrier.start(time)
  modulator.start(time)
  carrier.stop(endTime)
  modulator.stop(endTime)

  return buildVoiceHandle(ctx, [carrier, modulator], [amp], endTime)
}

/**
 * ElectricPiano: FM tine. Ratio ~3.5 with a fast modulator decay and a
 * second partial gives the characteristic Rhodes-like bark without any
 * samples.
 */
export const electricPianoInstrument: Instrument = {
  id: 'electric-piano',
  trigger(ctx, trigger) {
    return fmTrigger(ctx, trigger, {
      ratio: 3.5,
      index: 2.2,
      indexEndRatio: 0.08,
      peakGain: 0.42,
      partial: [2, 0.16],
      attack: 0.006,
      release: 0.35,
    })
  },
}

/**
 * Bell: inharmonic FM (ratio 2.76) with a long ring and a high
 * velocity-sensitive index.
 */
export const bellInstrument: Instrument = {
  id: 'bell',
  trigger(ctx, trigger) {
    return fmTrigger(ctx, trigger, {
      ratio: 2.76,
      index: 7,
      indexEndRatio: 0.02,
      peakGain: 0.3,
      attack: 0.004,
      release: 1.8,
    })
  },
}
