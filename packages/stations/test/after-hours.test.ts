import type { GenerationContext, MusicalEvent } from '@infinite-radio/shared'
import { describe, expect, it } from 'vitest'

import { afterHoursStation } from '../src/definitions/after-hours'

function makeRandom(seed: number, sectionIndex: number): () => number {
  let state = (seed ^ ((sectionIndex + 1) * 0x9e3779b1)) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeContext(overrides: Partial<GenerationContext> = {}): GenerationContext {
  const seed = overrides.seed ?? 42
  const sectionIndex = overrides.sectionIndex ?? 2 // past the intro
  return {
    seed,
    sectionIndex,
    startBar: sectionIndex * afterHoursStation.barsPerSection,
    bars: afterHoursStation.barsPerSection,
    energy: 0.6,
    parameters: { ...afterHoursStation.parameters },
    random: makeRandom(seed, sectionIndex),
    ...overrides,
  }
}

const signature = (events: MusicalEvent[]) =>
  events.map((e) => `${e.instrument}:${e.pitch ?? '-'}:${e.time}:${e.duration}`).join('|')

describe('After Hours station', () => {
  it('has a complete identity and three moods', () => {
    expect(afterHoursStation.id).toBe('after-hours')
    expect(afterHoursStation.moods.map((m) => m.name)).toEqual(['Deep', 'Hypnotic', 'Minimal'])
    expect(afterHoursStation.parameterSpecs).toHaveLength(4)
  })

  it('maintains a four-on-the-floor groove with a stable tempo grid', () => {
    const section = afterHoursStation.generator.generateSection(makeContext())
    const kicks = section.events.filter((e) => e.instrument === 'kick')
    expect(kicks.length).toBeGreaterThanOrEqual(28) // ~32 minus breakdown tolerance
    for (let i = 1; i < kicks.length; i++) {
      expect(kicks[i]!.time - kicks[i - 1]!.time).toBeCloseTo(1, 5)
    }
  })

  it('layers kick, hats, bass, pads, and arpeggio', () => {
    const section = afterHoursStation.generator.generateSection(makeContext())
    const instruments = new Set(section.events.map((e) => e.instrument))
    expect(instruments.has('kick')).toBe(true)
    expect(instruments.has('hi-hat')).toBe(true)
    expect(instruments.has('sub-bass')).toBe(true)
    expect(instruments.has('synth-pad')).toBe(true)
    expect(instruments.has('pluck')).toBe(true)
  })

  it('drops the kick in breakdown sections', () => {
    // Find a breakdown index from the arrangement cycle: intro(0), then
    // build, main, main, variation, main, breakdown at index 6.
    const breakdown = afterHoursStation.generator.generateSection(makeContext({ sectionIndex: 6 }))
    expect(breakdown.events.some((e) => e.instrument === 'kick')).toBe(false)
  })

  it('percussion intensity drives hat density', () => {
    const dense = Array.from({ length: 6 }, (_, i) =>
      afterHoursStation.generator.generateSection(
        makeContext({ seed: 200 + i, parameters: { ...afterHoursStation.parameters, percussionIntensity: 1 } }),
      ),
    ).reduce((sum, s) => sum + s.events.filter((e) => e.instrument === 'hi-hat').length, 0)
    const sparse = Array.from({ length: 6 }, (_, i) =>
      afterHoursStation.generator.generateSection(
        makeContext({ seed: 200 + i, parameters: { ...afterHoursStation.parameters, percussionIntensity: 0 } }),
      ),
    ).reduce((sum, s) => sum + s.events.filter((e) => e.instrument === 'hi-hat').length, 0)
    expect(dense).toBeGreaterThan(sparse)
  })

  it('bass intensity drives sub bass presence', () => {
    const strong = afterHoursStation.generator.generateSection(
      makeContext({ parameters: { ...afterHoursStation.parameters, bassIntensity: 1 } }),
    )
    const silent = afterHoursStation.generator.generateSection(
      makeContext({ parameters: { ...afterHoursStation.parameters, bassIntensity: 0 } }),
    )
    expect(strong.events.filter((e) => e.instrument === 'sub-bass').length).toBeGreaterThan(0)
    expect(silent.events.filter((e) => e.instrument === 'sub-bass')).toHaveLength(0)
  })

  it('is deterministic per seed and section index', () => {
    const a = afterHoursStation.generator.generateSection(makeContext({ seed: 7, sectionIndex: 3 }))
    const b = afterHoursStation.generator.generateSection(makeContext({ seed: 7, sectionIndex: 3 }))
    expect(signature(a.events)).toBe(signature(b.events))
  })

  it('keeps every event inside the section timeline', () => {
    const beats = afterHoursStation.barsPerSection * 4
    for (let i = 0; i < 8; i++) {
      const section = afterHoursStation.generator.generateSection(makeContext({ sectionIndex: i }))
      for (const event of section.events) {
        expect(event.time).toBeGreaterThanOrEqual(0)
        expect(event.time).toBeLessThan(beats + 0.5)
      }
    }
  })
})
