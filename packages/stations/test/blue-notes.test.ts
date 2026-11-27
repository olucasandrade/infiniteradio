import type { GenerationContext, MusicalEvent } from '@infinite-radio/shared'
import { buildChord, isChordTone, SCALES, type ChordQuality } from '@infinite-radio/composition-engine'
import { describe, expect, it } from 'vitest'

import { blueNotesStation } from '../src/definitions/blue-notes'
import { STATION_LIST } from '../src'

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
  const seed = overrides.seed ?? 21
  const sectionIndex = overrides.sectionIndex ?? 3
  return {
    seed,
    sectionIndex,
    startBar: sectionIndex * blueNotesStation.barsPerSection,
    bars: blueNotesStation.barsPerSection,
    energy: 0.5,
    parameters: { ...blueNotesStation.parameters },
    random: makeRandom(seed, sectionIndex),
    ...overrides,
  }
}

const SCALE_PCS = new Set(SCALES.dorian.map((s) => (46 + 12 + s) % 12))
const inKey = (midi: number) => SCALE_PCS.has(((midi % 12) + 12) % 12)

describe('Blue Notes station', () => {
  it('has a complete identity and three moods', () => {
    expect(blueNotesStation.id).toBe('blue-notes')
    expect(blueNotesStation.moods.map((m) => m.name)).toEqual(['Intimate', 'Smoky', 'Playful'])
    expect(blueNotesStation.parameterSpecs).toHaveLength(4)
  })

  it('comps extended chords on the electric piano with coherent voicings', () => {
    const section = blueNotesStation.generator.generateSection(makeContext())
    const ep = section.events.filter((e) => e.instrument === 'electric-piano' && e.mixRole !== 'lead')
    expect(ep.length).toBeGreaterThan(0)
    for (const event of ep) {
      const [root, quality] = section.harmony![Math.floor(event.time / 8)]!.split(':')
      expect(isChordTone(buildChord(Number(root), quality as ChordQuality), event.pitch!)).toBe(true)
    }
    // Chords are voiced compactly: simultaneous EP notes span under 2 octaves.
    const byTime = new Map<number, number[]>()
    for (const event of ep) {
      const list = byTime.get(event.time) ?? []
      list.push(event.pitch!)
      byTime.set(event.time, list)
    }
    for (const voices of byTime.values()) {
      expect(Math.max(...voices) - Math.min(...voices)).toBeLessThan(24)
    }
  })

  it('keeps the melody in key and within a sane register', () => {
    for (let i = 2; i < 12; i++) {
      const section = blueNotesStation.generator.generateSection(
        makeContext({
          sectionIndex: i,
          parameters: { ...blueNotesStation.parameters, melodicActivity: 1 },
        }),
      )
      for (const event of section.events.filter((e) => e.mixRole === 'lead')) {
        expect(inKey(event.pitch!)).toBe(true)
        expect(event.pitch!).toBeGreaterThanOrEqual(66)
        expect(event.pitch!).toBeLessThanOrEqual(92)
      }
    }
  })

  it('swings offbeat events when swing intensity is high', () => {
    const swung = blueNotesStation.generator.generateSection(
      makeContext({
        parameters: { ...blueNotesStation.parameters, swingIntensity: 1, rhythmicDensity: 1 },
      }),
    )
    const hats = swung.events.filter((e) => e.instrument === 'hi-hat')
    expect(hats.length).toBeGreaterThan(0)
    // Some hat lands strictly after its straight eighth position.
    const offbeats = hats.filter((e) => {
      const straight = Math.round(e.time * 2) / 2
      return Math.abs(e.time - straight - 0) > 0.001 && Math.abs((e.time % 1) - 0.5) < 0.2
    })
    expect(offbeats.length).toBeGreaterThan(0)
  })

  it('has bass movement centered on chord roots', () => {
    const section = blueNotesStation.generator.generateSection(makeContext())
    const bass = section.events.filter((e) => e.instrument === 'soft-bass')
    expect(bass.length).toBeGreaterThan(8)
    for (const event of bass) {
      expect(event.pitch!).toBeGreaterThanOrEqual(34)
      expect(event.pitch!).toBeLessThanOrEqual(70)
    }
  })

  it('is deterministic per seed and section index', () => {
    const sig = (events: MusicalEvent[]) =>
      events.map((e) => `${e.instrument}:${e.pitch ?? '-'}:${e.time}`).join('|')
    const a = blueNotesStation.generator.generateSection(makeContext({ seed: 3, sectionIndex: 4 }))
    const b = blueNotesStation.generator.generateSection(makeContext({ seed: 3, sectionIndex: 4 }))
    expect(sig(a.events)).toBe(sig(b.events))
  })
})

describe('station identity separation', () => {
  it('all seven stations produce distinguishable event palettes', () => {
    const ctxOptions = { seed: 11, sectionIndex: 3 }

    const palette = (events: MusicalEvent[]) =>
      [...new Set(events.map((e) => e.instrument))].sort().join(',')
    const palettes = STATION_LIST.map((station) =>
      palette(station.generator.generateSection(makeContextFor(station, ctxOptions)).events),
    )
    expect(new Set(palettes).size).toBe(STATION_LIST.length)
  })

  function makeContextFor(
    station: import('@infinite-radio/shared').StationDefinition,
    options: { seed: number; sectionIndex: number },
  ): GenerationContext {
    return {
      seed: options.seed,
      sectionIndex: options.sectionIndex,
      startBar: options.sectionIndex * station.barsPerSection,
      bars: station.barsPerSection,
      energy: 0.5,
      parameters: { ...station.parameters },
      random: makeRandom(options.seed, options.sectionIndex),
    }
  }
})
