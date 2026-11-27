import { describe, expect, it } from 'vitest'

import { INSTRUMENT_IDS, createInstrument } from '../src/instruments/registry'
import type { TriggerContext } from '../src/instruments/types'
import {
  MockAudioNode,
  createMockContextInstance,
} from './mockAudioContext'

function makeTrigger(overrides: Partial<TriggerContext> = {}): TriggerContext {
  const destination = new MockAudioNode() as unknown as AudioNode & MockAudioNode
  return {
    destination,
    time: 1,
    durationSeconds: 1.5,
    velocity: 0.8,
    pitch: 60,
    ...overrides,
  }
}

describe('instrument registry', () => {
  it('implements every shared InstrumentId', () => {
    expect(INSTRUMENT_IDS).toHaveLength(12)
    for (const id of INSTRUMENT_IDS) {
      expect(createInstrument(id).id).toBe(id)
    }
  })

  it('gives each instrument a distinct identity', () => {
    const ids = new Set(INSTRUMENT_IDS.map((id) => createInstrument(id).id))
    expect(ids.size).toBe(INSTRUMENT_IDS.length)
  })
})

describe('instrument voices', () => {
  it('every instrument produces a finite, stoppable voice', () => {
    for (const id of INSTRUMENT_IDS) {
      const ctx = createMockContextInstance()
      const instrument = createInstrument(id)
      const trigger = makeTrigger()
      const handle = instrument.trigger(ctx as unknown as BaseAudioContext, trigger)
      expect(Number.isFinite(handle.endTime)).toBe(true)
      expect(handle.endTime).toBeGreaterThan(trigger.time)
      handle.stop()
      handle.stop() // idempotent
    }
  })

  it('pad stacks detuned oscillators through a lowpass', () => {
    const ctx = createMockContextInstance()
    const pad = createInstrument('synth-pad')
    pad.trigger(ctx as unknown as BaseAudioContext, makeTrigger({ pitch: 48, durationSeconds: 4 }))
    expect(ctx.createdOscillators.length).toBe(3) // two saws + sub
    const detunes = ctx.createdOscillators.map((o) => o.detune.value)
    expect(detunes).toContain(-7)
    expect(detunes).toContain(7)
    expect(ctx.createdFilters.length).toBeGreaterThan(0)
  })

  it('kick drops pitch from 150Hz to 45Hz', () => {
    const ctx = createMockContextInstance()
    createInstrument('kick').trigger(ctx as unknown as BaseAudioContext, makeTrigger())
    const kick = ctx.createdOscillators[0]!
    expect(kick.frequency.value).toBe(45) // final ramp value
    const ramp = kick.frequency.calls.find((c) => c.method === 'exponentialRampToValueAtTime')
    expect(ramp).toBeDefined()
  })

  it('hi-hat uses a highpass on noise', () => {
    const ctx = createMockContextInstance()
    createInstrument('hi-hat').trigger(ctx as unknown as BaseAudioContext, makeTrigger())
    expect(ctx.createdBufferSources.length).toBe(1)
    const highpass = ctx.createdFilters.find((f) => f.type === 'highpass')
    expect(highpass).toBeDefined()
    expect(highpass!.frequency.value).toBeGreaterThan(6000)
  })

  it('noise texture loops and respects duration', () => {
    const ctx = createMockContextInstance()
    const handle = createInstrument('noise-texture').trigger(
      ctx as unknown as BaseAudioContext,
      makeTrigger({ durationSeconds: 8 }),
    )
    const source = ctx.createdBufferSources[0]! as unknown as { loop: boolean }
    expect(source.loop).toBe(true)
    expect(handle.endTime).toBeGreaterThan(8)
  })

  it('electric piano uses FM with a tine partial', () => {
    const ctx = createMockContextInstance()
    createInstrument('electric-piano').trigger(
      ctx as unknown as BaseAudioContext,
      makeTrigger({ pitch: 60 }),
    )
    // carrier + modulator + tine partial
    expect(ctx.createdOscillators.length).toBe(3)
    const ratios = ctx.createdOscillators.map((o) => o.frequency.value / 261.63)
    expect(ratios.some((r) => Math.abs(r - 3.5) < 0.01)).toBe(true)
  })

  it('voices clean up their nodes on stop', () => {
    const ctx = createMockContextInstance()
    const trigger = makeTrigger()
    const handle = createInstrument('pluck').trigger(
      ctx as unknown as BaseAudioContext,
      trigger,
    )
    handle.stop()
    // The amp gain was faded and the oscillator stopped.
    const amp = (trigger.destination as unknown as MockAudioNode).incoming[0] as unknown as {
      incoming: Array<{ incoming: Array<{ stopTime?: number }> }>
    }
    const filter = amp.incoming[0]!
    expect(filter.incoming[0]!.stopTime).toBeGreaterThan(0)
  })
})
