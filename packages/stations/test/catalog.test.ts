import type { StationId } from '@infinite-radio/shared'
import { SCALES, createSectionRandom } from '@infinite-radio/composition-engine'
import { describe, expect, it } from 'vitest'

import {
  EPISODE_WINDOW_MS,
  STATIONS,
  TRACK_CATALOGS,
  episodeIndexAt,
  episodeProgress,
  episodeRemainingMs,
  getCurrentEpisode,
  getEpisodeAt,
  getUpNextEpisode,
  type EpisodeReference,
} from '../src'

const STATION_IDS: StationId[] = [
  'weightless', 'hip-hop', 'blue-notes', 'neo-soul', 'vaporwave', 'indie', 'after-hours',
]

describe('track catalog', () => {
  it('has a deep, unique library per station', () => {
    for (const stationId of STATION_IDS) {
      const catalog = TRACK_CATALOGS[stationId]
      expect(catalog.length).toBeGreaterThanOrEqual(20)
      const keys = new Set(catalog.map((track) => `${track.title} · ${track.artist}`))
      expect(keys.size).toBe(catalog.length)
    }
  })

  it('traits are in range and scales are valid', () => {
    for (const stationId of STATION_IDS) {
      for (const track of TRACK_CATALOGS[stationId]) {
        expect(track.keyRootPc).toBeGreaterThanOrEqual(0)
        expect(track.keyRootPc).toBeLessThanOrEqual(11)
        expect(track.energy).toBeGreaterThanOrEqual(0)
        expect(track.energy).toBeLessThanOrEqual(1)
        expect(track.brightness).toBeGreaterThanOrEqual(0)
        expect(track.brightness).toBeLessThanOrEqual(1)
        expect(track.movement).toBeGreaterThanOrEqual(0)
        expect(track.movement).toBeLessThanOrEqual(1)
        expect(SCALES[track.scale]).toBeDefined()
      }
    }
  })
})

describe('transmission rotation', () => {
  it('is deterministic: the same window always yields the same episode', () => {
    for (const stationId of STATION_IDS) {
      const a = getEpisodeAt(stationId, 812_341)
      const b = getEpisodeAt(stationId, 812_341)
      expect(a.track).toEqual(b.track)
      expect(a.constraint).toEqual(b.constraint)
      expect(a.startedAtMs).toBe(812_341 * EPISODE_WINDOW_MS)
      expect(a.endsAtMs).toBe((812_341 + 1) * EPISODE_WINDOW_MS)
    }
  })

  it('varies with time: consecutive windows offer different programming', () => {
    for (const stationId of STATION_IDS) {
      const titles = new Set(
        [0, 1, 2, 3, 4, 5].map((offset) => getEpisodeAt(stationId, 500_000 + offset).track.title),
      )
      // With 28+ tracks per station, six consecutive episodes must not
      // collapse to a single recording.
      expect(titles.size).toBeGreaterThanOrEqual(3)
    }
  })

  it('never repeats: every recording plays exactly once per library cycle', () => {
    for (const stationId of STATION_IDS) {
      const size = TRACK_CATALOGS[stationId].length
      for (const cycle of [-3, 0, 11]) {
        const titles = new Set(
          Array.from(
            { length: size },
            (_, position) => getEpisodeAt(stationId, cycle * size + position).track.title,
          ),
        )
        expect(titles.size).toBe(size)
      }
    }
  })

  it('never plays the same recording twice in a row, even across cycle seams', () => {
    for (const stationId of STATION_IDS) {
      let previous = ''
      for (let index = -70; index < 180; index++) {
        const title = getEpisodeAt(stationId, index).track.title
        expect(title).not.toBe(previous)
        previous = title
      }
    }
  })

  it('is actually infinite: any index resolves, past or future', () => {
    for (const stationId of STATION_IDS) {
      for (const index of [-1_000_000, -5, 0, 9_000_000]) {
        const episode = getEpisodeAt(stationId, index)
        expect(TRACK_CATALOGS[stationId]).toContain(episode.track)
        expect(Number.isInteger(episode.constraint.seed)).toBe(true)
        expect(episode.constraint.seed).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('rotations are independent per station', () => {
    const a = getEpisodeAt('weightless', 42)
    const b = getEpisodeAt('blue-notes', 42)
    expect(a.track.title).not.toBe(b.track.title)
    expect(a.constraint.seed).not.toBe(b.constraint.seed)
  })

  it('maps wall-clock time to the current episode and its successor', () => {
    const now = 1_800_000_000_000
    const current = getCurrentEpisode('after-hours', now)
    expect(current.index).toBe(episodeIndexAt(now))
    expect(current.startedAtMs).toBeLessThanOrEqual(now)
    expect(current.endsAtMs).toBeGreaterThan(now)

    const upNext = getUpNextEpisode('after-hours', now)
    expect(upNext.index).toBe(current.index + 1)
    expect(upNext.startedAtMs).toBe(current.endsAtMs)
  })

  it('progress and remaining time stay within bounds', () => {
    const start = episodeIndexAt(1_800_000_000_000) * EPISODE_WINDOW_MS
    expect(episodeProgress(start)).toBe(0)
    expect(episodeProgress(start + EPISODE_WINDOW_MS - 1)).toBeLessThan(1)
    expect(episodeRemainingMs(start)).toBe(EPISODE_WINDOW_MS)
    // One millisecond before the boundary only one second remains.
    expect(episodeRemainingMs(start + EPISODE_WINDOW_MS - 1000)).toBe(1000)
    // Exactly at the boundary a fresh window starts.
    expect(episodeRemainingMs(start + EPISODE_WINDOW_MS)).toBe(EPISODE_WINDOW_MS)
  })

  it('episode constraints carry the reference track traits', () => {
    const episode = getEpisodeAt('blue-notes', 7)
    expect(episode.constraint.keyRootPc).toBe(episode.track.keyRootPc)
    expect(episode.constraint.scale).toBe(episode.track.scale)
    expect(episode.constraint.energy).toBe(episode.track.energy)
  })
})

describe('episode-steered generation', () => {
  it('different episodes steer the same station differently', () => {
    const station = STATIONS['weightless']!

    const episodeA = getEpisodeAt('weightless', 100)
    const episodeB = getEpisodeAt('weightless', 101)

    const contextFor = (episode: EpisodeReference) => ({
      seed: episode.constraint.seed,
      sectionIndex: 3,
      startBar: 12,
      bars: station.barsPerSection,
      energy: 0.5,
      parameters: station.parameters,
      episode: episode.constraint,
      random: createSectionRandom(episode.constraint.seed, 3),
    })

    const sectionA = station.generator.generateSection(contextFor(episodeA))
    const sectionB = station.generator.generateSection(contextFor(episodeB))

    // Different keys or traits must change the pitches that come out.
    expect(sectionA.events.map((event) => event.pitch)).not.toEqual(
      sectionB.events.map((event) => event.pitch),
    )
  })

  it('the same episode is reproducible note for note', () => {
    const station = STATIONS['after-hours']!
    const episode = getEpisodeAt('after-hours', 55)

    const buildContext = () => ({
      seed: episode.constraint.seed,
      sectionIndex: 2,
      startBar: 16,
      bars: station.barsPerSection,
      energy: 0.5,
      parameters: station.parameters,
      episode: episode.constraint,
      random: createSectionRandom(episode.constraint.seed, 2),
    })

    const a = station.generator.generateSection(buildContext())
    const b = station.generator.generateSection(buildContext())
    expect(a.events).toEqual(b.events)
  })
})
