import { describe, expect, it } from 'vitest'

import { applyEnvelope } from '../src/effects/envelope'
import { createImpulseResponse, createReverb } from '../src/effects/reverb'
import { createSaturationCurve } from '../src/effects/saturation'
import { sineToneInstrument } from '../src/instruments/sine-tone'
import {
  MockAudioParam,
  MockAudioNode,
  MockConvolverNode,
  MockOscillatorNode,
  createMockContextInstance,
} from './mockAudioContext'

describe('ADSR envelope', () => {
  it('schedules attack, decay, sustain hold, and release', () => {
    const param = new MockAudioParam(0)
    const endTime = applyEnvelope(param as unknown as AudioParam, 1.0, 0.5, 2.0, {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.5,
      release: 0.3,
    })

    expect(endTime).toBeCloseTo(3.3)
    const methods = param.calls.map((c) => c.method)
    expect(methods[0]).toBe('setValueAtTime')
    expect(methods.filter((m) => m === 'exponentialRampToValueAtTime')).toHaveLength(3)

    const peakCall = param.calls[1]!
    expect(peakCall.args[0]).toBeCloseTo(0.5)
    // Sustain level = peak * sustain.
    expect(param.calls[2]!.args[0]).toBeCloseTo(0.25)
    // Final release ramp ends near-silence.
    expect(param.calls[4]!.args[0]).toBeCloseTo(0.0001)
  })

  it('enforces a minimum release to avoid clicks', () => {
    const param = new MockAudioParam(0)
    const endTime = applyEnvelope(param as unknown as AudioParam, 0, 1, 0.5, {
      attack: 0,
      decay: 0,
      sustain: 1,
      release: 0,
    })
    expect(endTime).toBeGreaterThan(0.5)
  })
})

describe('reverb', () => {
  it('generates an impulse response with the requested length', () => {
    const ctx = createMockContextInstance()
    const ir = createImpulseResponse(ctx as unknown as BaseAudioContext, 2)
    expect(ir.length).toBe(ctx.sampleRate * 2)
    const left = ir.getChannelData(0)
    expect(left.some((v) => v !== 0)).toBe(true)
    // Decays towards the tail.
    expect(Math.abs(left[0]!)).toBeGreaterThan(Math.abs(left[left.length - 1]!))
  })

  it('builds a wet/dry convolver chain', () => {
    const ctx = createMockContextInstance()
    const reverb = createReverb(ctx as unknown as BaseAudioContext, { decaySeconds: 1.5, wet: 0.4 })
    expect(reverb.input).toBeDefined()
    expect(reverb.output).toBeDefined()
    // Walk the input's connections to find the convolver.
    const input = reverb.input as unknown as { connections: unknown[] }
    const convolver = input.connections.find(
      (node: unknown) => node instanceof MockConvolverNode,
    )
    expect(convolver).toBeDefined()
    expect((convolver as MockConvolverNode).buffer).not.toBeNull()
    reverb.dispose()
  })
})

describe('saturation', () => {
  it('produces a symmetric soft-clipping curve', () => {
    const curve = createSaturationCurve(0.5)
    expect(curve[0]).toBeCloseTo(-curve[curve.length - 1]!, 5)
    expect(curve[Math.floor((curve.length - 1) / 2)]).toBeCloseTo(0, 2)
    // Monotonic on the positive half.
    const mid = Math.floor((curve.length - 1) / 2)
    for (let i = mid; i < curve.length - 1; i++) {
      expect(curve[i + 1]!).toBeGreaterThan(curve[i]!)
    }
  })
})

describe('instrument voices', () => {
  it('triggers a sine voice with envelope and pitch', () => {
    const ctx = createMockContextInstance()
    const destination = new MockAudioNode() as unknown as AudioNode & MockAudioNode
    const handle = sineToneInstrument.trigger(ctx as unknown as BaseAudioContext, {
      destination,
      time: 0.5,
      durationSeconds: 1,
      velocity: 1,
      pitch: 69, // A4 = 440Hz
    })

    // The voice chain: osc -> gain -> destination.
    const gain = destination.incoming[0] as { incoming: unknown[] }
    expect(gain.incoming[0]).toBeInstanceOf(MockOscillatorNode)
    const oscillator = gain.incoming[0] as MockOscillatorNode
    expect(oscillator.started).toBe(true)
    expect(oscillator.frequency.value).toBe(440)
    expect(handle.endTime).toBeGreaterThan(1)

    handle.stop()
    expect(oscillator.stopped).toBe(true)
  })

  it('supports simultaneous voices', () => {
    const ctx = createMockContextInstance()
    const destination = new MockAudioNode() as unknown as AudioNode & MockAudioNode
    const first = sineToneInstrument.trigger(ctx as unknown as BaseAudioContext, {
      destination,
      time: 0,
      durationSeconds: 2,
      velocity: 1,
      pitch: 60,
    })
    const second = sineToneInstrument.trigger(ctx as unknown as BaseAudioContext, {
      destination,
      time: 0,
      durationSeconds: 2,
      velocity: 0.5,
      pitch: 64,
    })
    expect(first.endTime).toBeGreaterThan(0)
    expect(second.endTime).toBeGreaterThan(0)
    first.stop()
    second.stop()
  })
})
