import type { GenerationContext, StationDefinition } from '@infinite-radio/shared'
import { createSectionRandom } from '@infinite-radio/composition-engine'
import { describe, expect, it } from 'vitest'

import {
  STATION_LIST,
  getEpisodeAt,
  lowEndStation,
  openWindowStation,
  vaporTrailsStation,
  velvetStation,
} from '../src'

function contextFor(
  station: StationDefinition,
  parameters: Record<string, number> = {},
  sectionIndex = 3,
): GenerationContext {
  return {
    seed: 90210,
    sectionIndex,
    startBar: sectionIndex * station.barsPerSection,
    bars: station.barsPerSection,
    energy: 0.5,
    parameters: { ...station.parameters, ...parameters },
    random: createSectionRandom(90210, sectionIndex),
  }
}

const events = (station: StationDefinition, parameters: Record<string, number> = {}) =>
  station.generator.generateSection(contextFor(station, parameters)).events

describe('Low End', () => {
  it('uses syncopated drums and delayed backbeats instead of four-on-the-floor', () => {
    const generated = events(lowEndStation)
    const kicks = generated.filter((event) => event.instrument === 'kick')
    const snares = generated.filter(
      (event) => event.instrument === 'snare' && event.velocity! > 0.5,
    )
    expect(kicks.length).toBeGreaterThan(8)
    expect(kicks.some((kick, index) => index > 0 && kick.time - kicks[index - 1]!.time !== 1)).toBe(
      true,
    )
    expect(snares.every((snare) => !Number.isInteger(snare.time))).toBe(true)
    expect(generated.some((event) => event.instrument === 'electric-piano')).toBe(true)
  })

  it('makes all four controls affect generation', () => {
    expect(
      events(lowEndStation, { drumDensity: 1 }).filter((event) => event.type === 'drum').length,
    ).toBeGreaterThan(
      events(lowEndStation, { drumDensity: 0 }).filter((event) => event.type === 'drum').length,
    )
    expect(events(lowEndStation, { swingIntensity: 1 })).not.toEqual(
      events(lowEndStation, { swingIntensity: 0 }),
    )
    expect(
      events(lowEndStation, { bassIntensity: 1 }).filter(
        (event) => event.instrument === 'soft-bass',
      ).length,
    ).toBeGreaterThan(
      events(lowEndStation, { bassIntensity: 0 }).filter(
        (event) => event.instrument === 'soft-bass',
      ).length,
    )
    expect(
      events(lowEndStation, { textureAge: 1 }).some(
        (event) => event.instrument === 'noise-texture',
      ),
    ).toBe(true)
    expect(
      events(lowEndStation, { textureAge: 0 }).some(
        (event) => event.instrument === 'noise-texture',
      ),
    ).toBe(false)
  })
})

describe('Velvet', () => {
  it('places percussion behind the beat and uses extended voice-led harmony', () => {
    const generated = events(velvetStation, { harmonicComplexity: 1 })
    expect(
      generated
        .filter((event) => event.instrument === 'snare')
        .every((event) => !Number.isInteger(event.time)),
    ).toBe(true)
    const pianoTimes = new Set(
      generated.filter((event) => event.instrument === 'electric-piano').map((event) => event.time),
    )
    expect(
      [...pianoTimes].some(
        (time) =>
          generated.filter((event) => event.instrument === 'electric-piano' && event.time === time)
            .length >= 4,
      ),
    ).toBe(true)
  })

  it('makes harmony, drums, bass, and melody independently customizable', () => {
    expect(events(velvetStation, { harmonicComplexity: 1 })).not.toEqual(
      events(velvetStation, { harmonicComplexity: 0 }),
    )
    expect(
      events(velvetStation, { rhythmicDensity: 0 }).filter((event) => event.type === 'drum'),
    ).toHaveLength(0)
    expect(
      events(velvetStation, { bassMovement: 1 }).filter((event) => event.instrument === 'soft-bass')
        .length,
    ).toBeGreaterThan(
      events(velvetStation, { bassMovement: 0 }).filter((event) => event.instrument === 'soft-bass')
        .length,
    )
    expect(
      events(velvetStation, { melodicActivity: 0 }).filter((event) => event.mixRole === 'lead'),
    ).toHaveLength(0)
    expect(
      events(velvetStation, { melodicActivity: 1 }).filter((event) => event.mixRole === 'lead')
        .length,
    ).toBeGreaterThan(0)
  })
})

describe('Vapor Trails', () => {
  it('uses long modulated pads and half-time backbeats', () => {
    const generated = events(vaporTrailsStation)
    const pads = generated.filter((event) => event.instrument === 'synth-pad')
    expect(
      pads.every(
        (event) =>
          event.duration >= 14 && event.duration <= 16 &&
          event.parameters?.wobble !== undefined &&
          event.parameters.wobble > 0,
      ),
    ).toBe(true)
    expect(
      generated
        .filter((event) => event.instrument === 'snare')
        .every((event) => event.time % 4 > 2),
    ).toBe(true)
  })

  it('makes texture, wobble, rhythm, and depth audible in event data', () => {
    expect(
      events(vaporTrailsStation, { textureDensity: 1 }).filter(
        (event) => event.instrument === 'synth-pad',
      ).length,
    ).toBeGreaterThan(
      events(vaporTrailsStation, { textureDensity: 0 }).filter(
        (event) => event.instrument === 'synth-pad',
      ).length,
    )
    expect(events(vaporTrailsStation, { tapeWobble: 1 })[0]!.parameters!.wobble).toBeGreaterThan(
      events(vaporTrailsStation, { tapeWobble: 0 })[0]!.parameters!.wobble!,
    )
    expect(
      events(vaporTrailsStation, { rhythmicDensity: 0 }).filter((event) => event.type === 'drum'),
    ).toHaveLength(0)
    expect(
      events(vaporTrailsStation, { spatialDepth: 1 }).filter(
        (event) => event.instrument === 'noise-texture',
      ).length,
    ).toBeGreaterThan(
      events(vaporTrailsStation, { spatialDepth: 0 }).filter(
        (event) => event.instrument === 'noise-texture',
      ).length,
    )
  })
})

describe('Open Window', () => {
  it('uses synthesized strings with a restrained groove', () => {
    const generated = events(openWindowStation)
    expect(
      generated.filter((event) => event.instrument === 'guitar-string').length,
    ).toBeGreaterThan(20)
    expect(generated.some((event) => event.instrument === 'soft-bass')).toBe(true)
    expect(generated.some((event) => event.instrument === 'snare')).toBe(true)
  })

  it('makes strumming, melody, percussion, and atmosphere independently customizable', () => {
    expect(
      events(openWindowStation, { strumDensity: 1 }).filter(
        (event) => event.instrument === 'guitar-string',
      ).length,
    ).toBeGreaterThan(
      events(openWindowStation, { strumDensity: 0 }).filter(
        (event) => event.instrument === 'guitar-string',
      ).length,
    )
    expect(
      events(openWindowStation, { melodicActivity: 1, strumDensity: 0 }).filter(
        (event) => event.mixRole === 'lead',
      ).length,
    ).toBeGreaterThan(
      events(openWindowStation, { melodicActivity: 0, strumDensity: 0 }).filter(
        (event) => event.mixRole === 'lead',
      ).length,
    )
    expect(
      events(openWindowStation, { percussionIntensity: 0 }).filter(
        (event) => event.type === 'drum',
      ),
    ).toHaveLength(0)
    expect(
      events(openWindowStation, { atmosphericTexture: 0 }).filter(
        (event) => event.instrument === 'synth-pad',
      ),
    ).toHaveLength(0)
    expect(
      events(openWindowStation, { atmosphericTexture: 1 }).filter(
        (event) => event.instrument === 'synth-pad',
      ).length,
    ).toBeGreaterThan(0)
  })
})

describe('expanded station generation', () => {
  it('reproduces every station note for note', () => {
    for (const station of STATION_LIST) {
      expect(events(station)).toEqual(events(station))
    }
  })

  it('threads reference traits into every station deterministically', () => {
    for (const station of STATION_LIST) {
      const episode = getEpisodeAt(station.id, 43)
      const context = () => ({
        ...contextFor(station),
        seed: episode.constraint.seed,
        episode: episode.constraint,
        random: createSectionRandom(episode.constraint.seed, 3),
      })
      const a = station.generator.generateSection(context())
      const b = station.generator.generateSection(context())
      expect(a.events).toEqual(b.events)
      expect(episode.constraint.rhythmicDensity).toBe(
        episode.track.rhythmicDensity ?? episode.track.movement,
      )
      expect(episode.constraint.texture).toBe(episode.track.texture ?? episode.track.brightness)
    }
  })

  it('produces distinct event signatures for all seven stations', () => {
    const signatures = STATION_LIST.map((station) => {
      const generated = events(station)
      return [
        ...new Set(
          generated.map(
            (event) => `${event.instrument}:${event.time % 1 === 0 ? 'grid' : 'displaced'}`,
          ),
        ),
      ]
        .sort()
        .join('|')
    })
    expect(new Set(signatures).size).toBe(7)
  })
})
