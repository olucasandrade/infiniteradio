import type { StationId } from '@infinite-radio/shared'
import { beforeEach, describe, expect, it } from 'vitest'

import { WebAudioEngine } from '../src/core/engine'
import { installMockAudioContext } from './mockAudioContext'
import { makeStation } from './fixtures'

function makeEngine() {
  const registry = {
    weightless: makeStation('weightless'),
    'blue-notes': makeStation('blue-notes'),
    'after-hours': makeStation('after-hours'),
  } as Record<StationId, ReturnType<typeof makeStation>>
  return new WebAudioEngine(registry, { transitionSeconds: 2 })
}

describe('station transitions', () => {
  beforeEach(() => {
    installMockAudioContext()
  })

  it('crossfades buses and keeps playing status when switching mid-playback', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('weightless')
    await engine.play()

    await engine.switchStation('blue-notes')

    expect(engine.getStatus()).toBe('playing')
    const runtime = engine.getRuntime()!
    // New station's scheduler starts after the crossfade delay.
    expect(runtime.scheduler?.isRunning()).toBe(true)
    expect(runtime.definition.id).toBe('blue-notes')
  })

  it('does not restart the scheduler when the mood (parameters) changes', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('after-hours')
    await engine.play()

    const scheduler = engine.getRuntime()!.scheduler!
    engine.updateParameters({ bassIntensity: 0.2, atmosphericTexture: 0.9 })
    engine.updateParameters({ bassIntensity: 0.9 })

    // Same scheduler instance, still running — no restart.
    expect(engine.getRuntime()!.scheduler).toBe(scheduler)
    expect(scheduler.isRunning()).toBe(true)
    expect(engine.getStatus()).toBe('playing')
  })

  it('silences the previous bus over the transition window', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('weightless')
    const firstBus = engine.getRuntime()!.bus

    await engine.switchStation('blue-notes')

    // The old bus received a fade-out ramp on its output gain.
    const output = firstBus.output as unknown as {
      gain: { calls: Array<{ method: string; args: number[] }> }
    }
    const ramps = output.gain.calls.filter((c) => c.method === 'linearRampToValueAtTime')
    expect(ramps.some((c) => c.args[0] === 0)).toBe(true)
  })

  it('switching to the same station is a no-op', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('weightless')
    const seed = engine.getRuntime()!.seed
    await engine.switchStation('weightless')
    expect(engine.getRuntime()!.seed).toBe(seed)
  })
})
