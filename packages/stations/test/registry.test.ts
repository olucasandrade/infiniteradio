import { STATION_LIST, getMood, mergeMoodParameters } from '../src'
import { describe, expect, it } from 'vitest'

describe('station registry', () => {
  it('exposes the seven stations in discovery order', () => {
    expect(STATION_LIST.map((s) => s.id)).toEqual([
      'weightless', 'hip-hop', 'blue-notes', 'neo-soul', 'vaporwave', 'indie', 'after-hours',
    ])
  })

  it('every station has three moods and four customization parameters', () => {
    for (const station of STATION_LIST) {
      expect(station.moods).toHaveLength(3)
      expect(station.parameterSpecs).toHaveLength(4)
      expect(station.defaultMood).toBe(station.moods[0]!.id)
      for (const spec of station.parameterSpecs) {
        expect(station.parameters[spec.id]).toBeCloseTo(spec.defaultValue, 5)
      }
    }
  })

  it('moods override generation parameters without losing identity', () => {
    const station = STATION_LIST[0]!
    const calm = mergeMoodParameters(station, station.moods[0]!.id)
    const intense = mergeMoodParameters(station, station.moods[2]!.id)
    expect(calm).not.toEqual(intense)
    // Every effective parameter is normalized.
    for (const value of Object.values(intense)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })

  it('getMood falls back to the first mood for unknown ids', () => {
    const station = STATION_LIST[1]!
    expect(getMood(station, 'nope').id).toBe(station.moods[0]!.id)
  })

  it('every referenced instrument exists in the palette', () => {
    const valid = new Set([
      'synth-pad',
      'drone',
      'soft-bass',
      'sub-bass',
      'electric-piano',
      'bell',
      'pluck',
      'kick',
      'snare',
      'hi-hat',
      'noise-texture',
      'guitar-string',
    ])
    for (const station of STATION_LIST) {
      for (let i = 0; i < 6; i++) {
        const section = station.generator.generateSection({
          seed: 77,
          sectionIndex: i,
          startBar: i * station.barsPerSection,
          bars: station.barsPerSection,
          energy: 0.5,
          parameters: station.parameters,
          random: (() => {
            let state = (77 ^ ((i + 1) * 0x9e3779b1)) >>> 0
            return () => {
              state = (state + 0x6d2b79f5) | 0
              let t = Math.imul(state ^ (state >>> 15), 1 | state)
              t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
              return ((t ^ (t >>> 14)) >>> 0) / 4294967296
            }
          })(),
        })
        for (const event of section.events) {
          expect(valid.has(event.instrument)).toBe(true)
        }
      }
    }
  })
})
