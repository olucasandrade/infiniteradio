import type { StationDefinition, StationId } from '@infinite-radio/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AudioEngineError, WebAudioEngine } from '../src/core/engine'
import {
  installMockAudioContext,
  MockAudioContext,
  MockAudioParam,
} from './mockAudioContext'
import { makeStation } from './fixtures'

function makeEngine(stations?: Partial<Record<StationId, StationDefinition>>) {
  const registry = {
    weightless: makeStation('weightless'),
    'blue-notes': makeStation('blue-notes'),
    'after-hours': makeStation('after-hours'),
    ...stations,
  } as Record<StationId, StationDefinition>
  return new WebAudioEngine(registry, { transitionSeconds: 0.5 })
}

describe('WebAudioEngine lifecycle', () => {
  beforeEach(() => {
    installMockAudioContext()
  })

  it('initializes a context and master chain', async () => {
    const engine = makeEngine()
    const statuses: string[] = []
    engine.onStatusChange((s) => statuses.push(s))

    await engine.initialize()

    expect(engine.getStatus()).toBe('ready')
    expect(statuses).toEqual(['ready'])
    expect(engine.getAnalyser()).not.toBeNull()
  })

  it('play resumes the context and pause suspends it', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.play()

    const ctx = (engine as unknown as { ctx: MockAudioContext }).ctx
    expect(ctx.state).toBe('running')
    expect(engine.getStatus()).toBe('playing')

    engine.pause()
    expect(ctx.state).toBe('suspended')
    expect(engine.getStatus()).toBe('paused')
  })

  it('refuses to play before initialization', async () => {
    const engine = makeEngine()
    await expect(engine.play()).rejects.toBeInstanceOf(AudioEngineError)
  })

  it('throws and reports a useful error when Web Audio is unsupported', async () => {
    ;(globalThis as { AudioContext?: unknown }).AudioContext = undefined
    const engine = makeEngine()
    const dispatch = vi.fn()
    ;(globalThis as { dispatchEvent: unknown }).dispatchEvent = dispatch

    await expect(engine.initialize()).rejects.toBeInstanceOf(AudioEngineError)
    expect(engine.getStatus()).toBe('error')
    expect(dispatch).toHaveBeenCalled()
  })

  it('dispose releases the context and all resources', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('weightless')
    const ctx = (engine as unknown as { ctx: MockAudioContext }).ctx

    engine.dispose()

    expect(ctx.closed).toBe(true)
    expect(engine.getStatus()).toBe('idle')
    expect(engine.getAnalyser()).toBeNull()
  })
})

describe('WebAudioEngine volume and mute', () => {
  beforeEach(() => {
    installMockAudioContext()
  })

  it('applies master volume through the gain node', async () => {
    const engine = makeEngine()
    await engine.initialize()
    const gain = (
      engine as unknown as { master: { gain: { gain: MockAudioParam } } }
    ).master.gain.gain

    engine.setMasterVolume(0.4)
    expect(gain.calls.some((c) => c.method === 'setTargetAtTime' && c.args[0] === 0.4)).toBe(
      true,
    )
  })

  it('mute zeroes the output while preserving the volume', async () => {
    const engine = makeEngine()
    await engine.initialize()
    const gain = (
      engine as unknown as { master: { gain: { gain: MockAudioParam } } }
    ).master.gain.gain

    engine.setMasterVolume(0.7)
    engine.setMuted(true)
    expect(gain.value).toBe(0)

    engine.setMuted(false)
    expect(gain.value).toBe(0.7)
  })

  it('clamps volume into 0..1', async () => {
    const engine = makeEngine()
    await engine.initialize()
    const gain = (
      engine as unknown as { master: { gain: { gain: MockAudioParam } } }
    ).master.gain.gain
    engine.setMasterVolume(5)
    engine.setMuted(false)
    expect(gain.value).toBe(1)
  })
})

describe('WebAudioEngine stations', () => {
  beforeEach(() => {
    installMockAudioContext()
  })

  it('switches stations and tracks the current one', async () => {
    const engine = makeEngine()
    await engine.initialize()

    await engine.switchStation('weightless')
    expect(engine.getCurrentStationId()).toBe('weightless')

    await engine.switchStation('blue-notes')
    expect(engine.getCurrentStationId()).toBe('blue-notes')
  })

  it('rejects unknown station ids', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await expect(
      engine.switchStation('techno' as StationId),
    ).rejects.toBeInstanceOf(AudioEngineError)
  })

  it('merges live parameter updates', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('weightless')

    engine.updateParameters({ density: 0.9, spatialDepth: 0.2 })
    const runtime = engine.getRuntime()
    expect(runtime?.parameters.density).toBe(0.9)
    expect(runtime?.parameters.spatialDepth).toBe(0.2)
  })
})
