import { describe, expect, it } from 'vitest'

import {
  createSectionRandom,
  mulberry32,
  euclideanRhythm,
  applySwing,
  velocityAt,
  eighthGrid,
  isStrongBeat,
  arrangementForSection,
  densityForState,
  energyForSection,
} from '../src'

describe('seeded random generation', () => {
  it('is reproducible for the same seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = [a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('differs across seeds', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()])
  })

  it('produces per-section sources that are stable and independent', () => {
    const first = createSectionRandom(7, 3)
    const again = createSectionRandom(7, 3)
    const other = createSectionRandom(7, 4)
    const seqFirst = [first(), first(), first()]
    expect(seqFirst).toEqual([again(), again(), again()])
    expect(seqFirst).not.toEqual([other(), other(), other()])
    expect(seqFirst.every((v) => v >= 0 && v < 1)).toBe(true)
  })
})

describe('euclidean rhythm', () => {
  it('distributes pulses evenly', () => {
    expect(euclideanRhythm(8, 3)).toEqual([true, false, false, true, false, false, true, false])
    expect(euclideanRhythm(4, 4)).toEqual([true, true, true, true])
    expect(euclideanRhythm(4, 0)).toEqual([false, false, false, false])
  })

  it('has exactly the requested pulse count', () => {
    for (const [steps, pulses] of [[16, 5], [12, 7], [9, 4]] as const) {
      const rhythm = euclideanRhythm(steps, pulses)
      expect(rhythm.filter(Boolean)).toHaveLength(pulses)
      expect(rhythm).toHaveLength(steps)
    }
  })
})

describe('swing timing', () => {
  it('leaves straight positions untouched at zero intensity', () => {
    expect(applySwing(2.5, 0)).toBe(2.5)
  })

  it('delays off-eighths', () => {
    const swung = applySwing(2.5, 1)
    expect(swung).toBeGreaterThan(2.5)
    expect(applySwing(2, 1)).toBe(2)
  })
})

describe('velocity variation', () => {
  it('humanizes within bounds and accents strong beats', () => {
    const rng = mulberry32(9)
    const strong = velocityAt(rng, { beat: 0, strong: true }, { base: 0.6, variation: 0, accent: 0.15 })
    const weak = velocityAt(rng, { beat: 1, strong: false }, { base: 0.6, variation: 0, accent: 0.15 })
    expect(strong).toBeCloseTo(0.75)
    expect(weak).toBeCloseTo(0.6)
    expect(strong).toBeGreaterThan(weak)
  })
})

describe('beat grids', () => {
  it('builds eighth grids', () => {
    expect(eighthGrid(1)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
  })

  it('identifies strong beats', () => {
    expect(isStrongBeat(0)).toBe(true)
    expect(isStrongBeat(2)).toBe(true)
    expect(isStrongBeat(1)).toBe(false)
    expect(isStrongBeat(3.5)).toBe(false)
  })
})

describe('arrangement', () => {
  it('starts with an intro and cycles through states', () => {
    expect(arrangementForSection(0)).toBe('intro')
    const states = Array.from({ length: 13 }, (_, i) => arrangementForSection(i))
    expect(new Set(states).size).toBeGreaterThan(2)
    expect(arrangementForSection(1)).toBe(arrangementForSection(1 + 6))
  })

  it('maps states to density multipliers', () => {
    expect(densityForState('intro')).toBeLessThan(densityForState('main'))
    expect(densityForState('breakdown')).toBeLessThan(densityForState('build'))
  })

  it('produces deterministic energy within 0..1', () => {
    const a = energyForSection(createSectionRandom(5, 0), 0.6)
    const b = energyForSection(createSectionRandom(5, 0), 0.6)
    expect(a).toBe(b)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThanOrEqual(1)
  })
})
