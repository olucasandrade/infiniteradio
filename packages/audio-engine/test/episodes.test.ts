import type { EpisodeConstraint } from '@infinite-radio/shared'
import { beforeEach, describe, expect, it } from 'vitest'

import { WebAudioEngine } from '../src/core/engine'
import { installMockAudioContext } from './mockAudioContext'
import { makeStation } from './fixtures'

const CONSTRAINT: EpisodeConstraint = {
  seed: 123456789,
  keyRootPc: 2,
  scale: 'dorian',
  energy: 0.4,
  brightness: 0.6,
  movement: 0.5,
}

function makeEngine() {
  return new WebAudioEngine(
    {
      weightless: makeStation('weightless'),
      'hip-hop': makeStation('hip-hop'),
      'blue-notes': makeStation('blue-notes'),
      'neo-soul': makeStation('neo-soul'),
      vaporwave: makeStation('vaporwave'),
      indie: makeStation('indie'),
      'after-hours': makeStation('after-hours'),
    },
    { transitionSeconds: 0.5 },
  )
}

describe('WebAudioEngine episode constraints', () => {
  beforeEach(() => {
    installMockAudioContext()
  })

  it('applies a pending constraint to the next station activation', async () => {
    const engine = makeEngine()
    await engine.initialize()
    engine.setEpisodeConstraint(CONSTRAINT)

    await engine.switchStation('weightless')
    const runtime = engine.getRuntime()!

    expect(runtime.episode).toEqual(CONSTRAINT)
    expect(runtime.seed).toBe(CONSTRAINT.seed)
  })

  it('updates the live runtime when the episode changes', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('weightless')

    engine.setEpisodeConstraint(CONSTRAINT)
    expect(engine.getRuntime()!.episode).toEqual(CONSTRAINT)
    expect(engine.getRuntime()!.seed).toBe(CONSTRAINT.seed)

    const next: EpisodeConstraint = { ...CONSTRAINT, seed: 987654321, keyRootPc: 7 }
    engine.setEpisodeConstraint(next)
    expect(engine.getRuntime()!.episode!.keyRootPc).toBe(7)
    expect(engine.getRuntime()!.seed).toBe(987654321)
  })

  it('clears the episode and keeps generating when passed null', async () => {
    const engine = makeEngine()
    await engine.initialize()
    engine.setEpisodeConstraint(CONSTRAINT)
    await engine.switchStation('blue-notes')

    engine.setEpisodeConstraint(null)
    expect(engine.getRuntime()!.episode).toBeNull()

    await engine.switchStation('after-hours')
    expect(engine.getRuntime()!.episode).toBeNull()
  })

  it('crossfades into a new episode while playing', async () => {
    const engine = makeEngine()
    await engine.initialize()
    await engine.switchStation('weightless')
    await engine.play()
    engine.updateParameters({ density: 0.2 })
    const firstRuntime = engine.getRuntime()!
    const firstBus = firstRuntime.bus

    engine.setEpisodeConstraint(CONSTRAINT)

    expect(engine.getStatus()).toBe('playing')
    const runtime = engine.getRuntime()!
    expect(runtime).not.toBe(firstRuntime)
    expect(runtime.episode).toEqual(CONSTRAINT)
    expect(runtime.seed).toBe(CONSTRAINT.seed)
    expect(runtime.scheduler?.isRunning()).toBe(true)
    // Live customization carries over into the new episode's runtime.
    expect(runtime.parameters.density).toBe(0.2)

    // The old bus received a fade-out ramp on its output gain.
    const output = firstBus.output as unknown as {
      gain: { calls: Array<{ method: string; args: number[] }> }
    }
    const ramps = output.gain.calls.filter((c) => c.method === 'linearRampToValueAtTime')
    expect(ramps.some((c) => c.args[0] === 0)).toBe(true)
  })

  it('re-applying the active episode while playing is a no-op', async () => {
    const engine = makeEngine()
    await engine.initialize()
    engine.setEpisodeConstraint(CONSTRAINT)
    await engine.switchStation('weightless')
    await engine.play()
    const runtime = engine.getRuntime()!

    engine.setEpisodeConstraint({ ...CONSTRAINT })

    expect(engine.getRuntime()).toBe(runtime)
  })
})
