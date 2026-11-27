import type { GenerationContext, MusicalEvent } from '@infinite-radio/shared'
import { describe, expect, it } from 'vitest'

import { weightlessStation } from '../src/definitions/weightless'

function makeContext(overrides: Partial<GenerationContext> = {}): GenerationContext {
  const seed = overrides.seed ?? 99
  const sectionIndex = overrides.sectionIndex ?? 0
  return {
    seed,
    sectionIndex,
    startBar: sectionIndex * weightlessStation.barsPerSection,
    bars: weightlessStation.barsPerSection,
    energy: 0.5,
    parameters: { ...weightlessStation.parameters },
    random: makeRandom(seed, sectionIndex),
    ...overrides,
  }
}

// Deterministic stand-in mirroring createSectionRandom without importing
// across package test boundaries.
function makeRandom(seed: number, sectionIndex: number): () => number {
  let state = (seed ^ ((sectionIndex + 1) * 0x9e3779b1)) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generate(context: GenerationContext) {
  return weightlessStation.generator.generateSection(context)
}

describe('Weightless station', () => {
  it('has a complete identity and three moods', () => {
    expect(weightlessStation.id).toBe('weightless')
    expect(weightlessStation.moods.map((m) => m.name)).toEqual([
      'Floating',
      'Vast',
      'Meditative',
    ])
    expect(weightlessStation.defaultMood).toBe('floating')
    expect(weightlessStation.parameterSpecs).toHaveLength(4)
  })

  it('generates coherent ambient sections without percussion', () => {
    const section = generate(makeContext())
    expect(section.events.length).toBeGreaterThan(0)
    const instruments = new Set(section.events.map((e) => e.instrument))
    expect(instruments.has('drone')).toBe(true)
    expect(instruments.has('kick')).toBe(false)
    expect(instruments.has('hi-hat')).toBe(false)
    expect(instruments.has('snare')).toBe(false)
  })

  it('uses long sustained events, not short pulses', () => {
    for (let i = 0; i < 8; i++) {
      const section = generate(makeContext({ sectionIndex: i }))
      for (const event of section.events) {
        expect(event.duration).toBeGreaterThan(1)
      }
    }
  })

  it('is deterministic per seed and section index', () => {
    const a = generate(makeContext({ seed: 7, sectionIndex: 3 }))
    const b = generate(makeContext({ seed: 7, sectionIndex: 3 }))
    const c = generate(makeContext({ seed: 8, sectionIndex: 3 }))
    const signature = (events: MusicalEvent[]) =>
      events.map((e) => `${e.instrument}:${e.pitch}:${e.time}:${e.duration}`).join('|')
    expect(signature(a.events)).toBe(signature(b.events))
    expect(signature(a.events)).not.toBe(signature(c.events))
  })

  it('produces sparser sections at low texture density', () => {
    const dense = generate(makeContext({ parameters: { ...weightlessStation.parameters, textureDensity: 1 } }))
    const sparse = generate(
      makeContext({ seed: 12345, parameters: { ...weightlessStation.parameters, textureDensity: 0 } }),
    )
    // Across deterministic seeds density 1 should average more events than 0.
    const denseCount = Array.from({ length: 6 }, (_, i) =>
      generate(makeContext({ seed: 100 + i, parameters: { ...weightlessStation.parameters, textureDensity: 1 } })),
    ).reduce((sum, s) => sum + s.events.length, 0)
    const sparseCount = Array.from({ length: 6 }, (_, i) =>
      generate(makeContext({ seed: 100 + i, parameters: { ...weightlessStation.parameters, textureDensity: 0 } })),
    ).reduce((sum, s) => sum + s.events.length, 0)
    expect(dense.events.length).toBeGreaterThan(0)
    expect(sparse.events.length).toBeGreaterThan(0)
    expect(denseCount).toBeGreaterThan(sparseCount)
  })

  it('keeps every event inside the section timeline', () => {
    const beats = weightlessStation.barsPerSection * 4
    for (let i = 0; i < 10; i++) {
      const section = generate(makeContext({ sectionIndex: i }))
      for (const event of section.events) {
        expect(event.time).toBeGreaterThanOrEqual(0)
        expect(event.time).toBeLessThan(beats + 1)
      }
    }
  })

  it('evolves: consecutive sections differ', () => {
    const a = generate(makeContext({ seed: 5, sectionIndex: 0 }))
    const b = generate(makeContext({ seed: 5, sectionIndex: 1 }))
    const sig = (events: MusicalEvent[]) =>
      events.map((e) => `${e.instrument}:${e.pitch}`).join('|')
    expect(sig(a.events)).not.toBe(sig(b.events))
  })
})
