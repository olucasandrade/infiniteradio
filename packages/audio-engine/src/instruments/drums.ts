import type { Instrument, VoiceHandle } from './types'
import { buildVoiceHandle, getNoiseBuffer } from './noise'

function scheduleDecay(
  ctx: BaseAudioContext,
  time: number,
  peak: number,
  decaySeconds: number,
): { amp: GainNode; endTime: number } {
  const amp = ctx.createGain()
  const endTime = time + decaySeconds
  amp.gain.setValueAtTime(0.0001, time)
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), time + 0.004)
  amp.gain.exponentialRampToValueAtTime(0.0001, endTime)
  return { amp, endTime }
}

/**
 * Kick: sine with a fast pitch drop (150→45Hz) — the deep four-on-the-floor
 * backbone of After Hours.
 */
export const kickInstrument: Instrument = {
  id: 'kick',
  trigger(ctx, trigger): VoiceHandle {
    const time = trigger.time
    const punch = trigger.parameters?.punch ?? 0.6
    const decay = 0.24 + trigger.velocity * 0.12 + punch * 0.08
    const { amp, endTime } = scheduleDecay(ctx, time, 0.75 * trigger.velocity + punch * 0.25, decay)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, time)
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.09)

    osc.connect(amp)
    amp.connect(trigger.destination)
    osc.start(time)
    osc.stop(endTime + 0.05)

    return buildVoiceHandle(ctx, [osc], [amp], endTime)
  },
}

/**
 * Snare: noise burst through a bandpass plus a 180Hz body thump.
 */
export const snareInstrument: Instrument = {
  id: 'snare',
  trigger(ctx, trigger): VoiceHandle {
    const time = trigger.time
    const peak = 0.5 * trigger.velocity + 0.05
    const { amp, endTime } = scheduleDecay(ctx, time, peak, 0.18)

    const noise = ctx.createBufferSource()
    noise.buffer = getNoiseBuffer(ctx)
    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 1900 - (trigger.parameters?.age ?? 0) * 900
    bandpass.Q.value = 0.8

    const body = ctx.createOscillator()
    body.type = 'triangle'
    body.frequency.value = 180

    noise.connect(bandpass)
    bandpass.connect(amp)
    body.connect(amp)
    amp.connect(trigger.destination)

    noise.start(time)
    body.start(time)
    noise.stop(endTime)
    body.stop(endTime)

    return buildVoiceHandle(ctx, [noise, body], [amp], endTime)
  },
}

/**
 * HiHat: short noise burst through a highpass. Velocity shapes the decay.
 */
export const hiHatInstrument: Instrument = {
  id: 'hi-hat',
  trigger(ctx, trigger): VoiceHandle {
    const time = trigger.time
    const decay = 0.03 + trigger.velocity * 0.07
    const { amp, endTime } = scheduleDecay(ctx, time, 0.32 * trigger.velocity + 0.04, decay)

    const noise = ctx.createBufferSource()
    noise.buffer = getNoiseBuffer(ctx)
    noise.loop = true
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 7800 - (trigger.parameters?.age ?? 0) * 4200

    noise.connect(highpass)
    highpass.connect(amp)
    amp.connect(trigger.destination)

    noise.start(time)
    noise.stop(endTime + 0.02)

    return buildVoiceHandle(ctx, [noise], [amp], endTime)
  },
}

/**
 * NoiseTexture: a long, quiet bed of filtered looping noise. Pitch acts
 * as a coarse register selector; `parameters.texture` (0..1) opens the
 * lowpass for Weightless' air.
 */
export const noiseTextureInstrument: Instrument = {
  id: 'noise-texture',
  trigger(ctx, trigger): VoiceHandle {
    const time = trigger.time
    const duration = Math.max(2, trigger.durationSeconds)
    const release = 2.5
    const endTime = time + duration + release

    const noise = ctx.createBufferSource()
    noise.buffer = getNoiseBuffer(ctx)
    noise.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    const openness = trigger.parameters?.texture ?? 0.5
    filter.frequency.value = 300 + openness * 2400
    filter.Q.value = 0.4

    const amp = ctx.createGain()
    const peak = 0.1 * trigger.velocity
    amp.gain.setValueAtTime(0.0001, time)
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), time + duration * 0.35)
    amp.gain.setValueAtTime(Math.max(0.0001, peak), time + duration)
    amp.gain.exponentialRampToValueAtTime(0.0001, endTime)

    noise.connect(filter)
    filter.connect(amp)
    amp.connect(trigger.destination)

    noise.start(time)
    noise.stop(endTime)

    return buildVoiceHandle(ctx, [noise], [amp], endTime)
  },
}
