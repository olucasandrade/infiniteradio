import { midiToFrequency } from '@infinite-radio/shared'

import type { Instrument, VoiceHandle } from './types'
import { buildVoiceHandle } from './noise'

export const guitarStringInstrument: Instrument = {
  id: 'guitar-string',
  trigger(ctx, trigger): VoiceHandle {
    const frequency = midiToFrequency(trigger.pitch ?? 60)
    const duration = Math.max(0.35, Math.min(4, trigger.durationSeconds + 0.8))
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const period = Math.max(2, Math.round(ctx.sampleRate / frequency))
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    const damping = 0.485 + (trigger.parameters?.damping ?? 0.45) * 0.012

    for (let i = 0; i < period; i++) data[i] = Math.random() * 2 - 1
    for (let i = period; i < length; i++) {
      data[i] = (data[i - period]! + data[i - period + 1]!) * damping
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1800 + trigger.velocity * 2600
    const amp = ctx.createGain()
    const endTime = trigger.time + duration
    amp.gain.setValueAtTime(0.0001, trigger.time)
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, trigger.velocity * 0.42), trigger.time + 0.006)
    amp.gain.exponentialRampToValueAtTime(0.0001, endTime)

    source.connect(filter)
    filter.connect(amp)
    amp.connect(trigger.destination)
    source.start(trigger.time)
    source.stop(endTime)
    return buildVoiceHandle(ctx, [source], [amp], endTime)
  },
}
