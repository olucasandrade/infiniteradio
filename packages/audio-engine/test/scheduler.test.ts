import type { GenerationContext, MusicalEvent, StationDefinition } from '@infinite-radio/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { StationRuntime } from '../src/core/engine'
import type { Instrument, TriggerContext, VoiceHandle } from '../src/instruments/types'
import { LookaheadScheduler } from '../src/scheduling/scheduler'
import { MockGainNode, createMockContextInstance } from './mockAudioContext'
import { makeStation } from './fixtures'

function makeRuntime(
  generator: (context: GenerationContext) => MusicalEvent[],
  overrides: Partial<StationDefinition> = {},
): StationRuntime {
  const definition = makeStation('weightless', {
    barsPerSection: 1,
    tempo: { minBpm: 120, maxBpm: 120 },
    ...overrides,
    generator: {
      generateSection: (context) => ({
        id: `s${context.sectionIndex}`,
        startBar: context.startBar,
        bars: 1,
        energy: 0.5,
        events: generator(context),
      }),
    },
  })
  return {
    definition,
    bus: {
      input: new MockGainNode(),
      fadeTo: () => {},
      dispose: () => {},
      level: 1,
    } as unknown as StationRuntime['bus'],
    bpm: 120,
    seed: 1234,
    episode: null,
    parameters: { density: 0.5 },
    scheduler: null,
  }
}

function fakeInstrument(triggers: TriggerContext[]): Instrument {
  return {
    id: 'bell',
    trigger(_ctx, trigger) {
      triggers.push(trigger)
      return { endTime: trigger.time + trigger.durationSeconds, stop: vi.fn() } satisfies VoiceHandle
    },
  }
}

describe('LookaheadScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('schedules sections ahead of the AudioContext clock', () => {
    const ctx = createMockContextInstance()
    const triggers: TriggerContext[] = []
    const event = (): MusicalEvent => ({
      id: 'e',
      type: 'note',
      instrument: 'bell',
      time: 0,
      duration: 1,
      pitch: 60,
    })
    const runtime = makeRuntime(() => [event()])
    const scheduler = new LookaheadScheduler(
      ctx as unknown as BaseAudioContext,
      runtime,
      () => fakeInstrument(triggers),
    )

    scheduler.start()
    // 120bpm, 1-bar sections: 2s each. Lookahead 1s → one section scheduled.
    expect(scheduler.scheduledCount).toBe(1)
    expect(triggers).toHaveLength(1)
    // Scheduled at the start time (no delay configured).
    expect(triggers[0]!.time).toBeCloseTo(0)

    ctx.currentTime = 2.05
    vi.advanceTimersByTime(100)
    expect(scheduler.scheduledCount).toBeGreaterThanOrEqual(2)
    scheduler.dispose()
  })

  it('keeps a continuous stream of sections without gaps', () => {
    const ctx = createMockContextInstance()
    const triggers: TriggerContext[] = []
    const runtime = makeRuntime(() => [
      { id: 'e', type: 'note', instrument: 'bell', time: 0, duration: 0.5 },
    ])
    const scheduler = new LookaheadScheduler(
      ctx as unknown as BaseAudioContext,
      runtime,
      () => fakeInstrument(triggers),
    )

    scheduler.start()
    for (let t = 0; t < 20; t += 0.1) {
      ctx.currentTime = t
      vi.advanceTimersByTime(100)
    }
    // Every 2s section boundary should have produced exactly one event.
    const starts = triggers.map((tr) => tr.time)
    expect(starts.length).toBeGreaterThanOrEqual(9)
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i]! - starts[i - 1]!).toBeCloseTo(2, 1)
    }
    scheduler.dispose()
  })

  it('respects the start delay (station crossfade)', () => {
    const ctx = createMockContextInstance()
    const triggers: TriggerContext[] = []
    const runtime = makeRuntime(() => [
      { id: 'e', type: 'note', instrument: 'bell', time: 0, duration: 0.5 },
    ])
    const scheduler = new LookaheadScheduler(
      ctx as unknown as BaseAudioContext,
      runtime,
      () => fakeInstrument(triggers),
      { startDelaySeconds: 3 },
    )
    scheduler.start()
    // Start is 3s out, beyond the 1s lookahead: nothing scheduled yet.
    expect(triggers).toHaveLength(0)
    ctx.currentTime = 2.1
    vi.advanceTimersByTime(100)
    expect(triggers).toHaveLength(1)
    expect(triggers[0]!.time).toBeCloseTo(3)
    scheduler.dispose()
  })

  it('stops voices on stop and resumes without overlapping voices', () => {
    const ctx = createMockContextInstance()
    const stops: Array<() => void> = []
    const runtime = makeRuntime(() => [
      { id: 'e', type: 'note', instrument: 'bell', time: 0, duration: 4 },
    ])
    const scheduler = new LookaheadScheduler(
      ctx as unknown as BaseAudioContext,
      runtime,
      () => ({
        id: 'bell',
        trigger: (_c, t) => {
          const stop = vi.fn()
          stops.push(stop)
          return { endTime: t.time + 4, stop } satisfies VoiceHandle
        },
      }),
    )
    scheduler.start()
    ctx.currentTime = 1
    scheduler.stop()
    expect(stops.length).toBeGreaterThan(0)
    for (const stop of stops) expect(stop).toHaveBeenCalled()
    const countAfterStop = stops.length

    // Resume at t=1: the stopped section is not re-triggered; the next
    // section boundary gets exactly one fresh voice.
    scheduler.start()
    expect(stops.length).toBe(countAfterStop + 1)
    // The voice from before the pause was stopped exactly once; the new
    // voice plays on.
    expect(stops[0]).toHaveBeenCalledTimes(1)
    expect(stops[1]).not.toHaveBeenCalled()
    scheduler.dispose()
  })

  it('passes live parameter updates to future sections', () => {
    const ctx = createMockContextInstance()
    const contexts: GenerationContext[] = []
    const runtime = makeRuntime((context) => {
      contexts.push(context)
      return []
    })
    const scheduler = new LookaheadScheduler(
      ctx as unknown as BaseAudioContext,
      runtime,
      () => fakeInstrument([]),
    )
    scheduler.start()
    scheduler.updateParameters({ density: 0.95 })

    ctx.currentTime = 2.1
    vi.advanceTimersByTime(100)
    expect(contexts.length).toBeGreaterThanOrEqual(2)
    expect(contexts[0]!.parameters.density).toBe(0.5)
    expect(contexts[contexts.length - 1]!.parameters.density).toBe(0.95)
    scheduler.dispose()
  })

  it('generates identical sections for the same seed', () => {
    const build = () => {
      const ctx = createMockContextInstance()
      const contexts: GenerationContext[] = []
      const runtime = makeRuntime((context) => {
        contexts.push(context)
        return [
          {
            id: 'e',
            type: 'note',
            instrument: 'bell',
            time: context.random(),
            duration: 0.5,
          },
        ]
      })
      const scheduler = new LookaheadScheduler(
        ctx as unknown as BaseAudioContext,
        runtime,
        () => fakeInstrument([]),
      )
      scheduler.start()
      scheduler.dispose()
      return contexts.map((c) => c.random())
    }
    expect(build()).toEqual(build())
  })
})
