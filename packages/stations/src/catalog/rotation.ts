import type { EpisodeConstraint, StationId } from '@infinite-radio/shared'
import { hashSeed, mulberry32 } from '@infinite-radio/composition-engine'

import { TRACK_CATALOGS, type TrackSeed } from './tracks'

/**
 * The transmission rotation: a deterministic, clock-driven sequence of
 * generative episodes. Each station draws one reference track per time
 * window; the track's traits and a derived seed steer the music that is
 * actually generated.
 *
 * The sequence is infinite in both directions: any window index (past or
 * future) maps to a stable episode, and it varies with wall-clock time,
 * so the programming changes for every listener as time passes. Two
 * listeners on the same station in the same window hear the same episode.
 *
 * No replays: windows are grouped into cycles of one full catalog, and
 * each cycle plays every recording exactly once in a shuffled order. A
 * recording can only return after the whole library has played, and even
 * then the per-window generation seed differs, so the music itself is
 * always a fresh composition.
 */

/** One episode slot lasts four minutes of wall-clock time. */
export const EPISODE_WINDOW_MS = 4 * 60 * 1000

/** A single slot in the rotation: the reference track plus its constraint. */
export interface EpisodeReference {
  /** Window index on the global clock; any integer, negative included. */
  index: number
  track: TrackSeed
  /** Epoch milliseconds at which this episode started. */
  startedAtMs: number
  /** Epoch milliseconds at which the next episode takes over. */
  endsAtMs: number
  /** Musical constraint handed to the audio engine for this episode. */
  constraint: EpisodeConstraint
}

/** Stable per-station salt so each station's rotation is independent. */
function stationSalt(stationId: StationId): number {
  let hash = 0x811c9dc5
  const key = `infinite-radio:${stationId}`
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Window index on the global episode clock for a point in time. */
export function episodeIndexAt(nowMs: number): number {
  return Math.floor(nowMs / EPISODE_WINDOW_MS)
}

/** Seeded Fisher–Yates permutation of catalog positions for one cycle. */
function shuffleForCycle(stationId: StationId, cycle: number): number[] {
  const size = TRACK_CATALOGS[stationId].length
  const order = Array.from({ length: size }, (_, position) => position)
  const rng = mulberry32(hashSeed(stationSalt(stationId) ^ 0x5bd1e995, cycle))
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const held = order[i]!
    order[i] = order[j]!
    order[j] = held
  }
  return order
}

/**
 * Last catalog position played in a cycle. The boundary swap below only
 * ever touches positions 0 and 1, and catalogs are far deeper than that,
 * so the final slot is always the raw shuffled one — no recursion needed.
 */
function lastPickOfCycle(stationId: StationId, cycle: number): number {
  return shuffleForCycle(stationId, cycle)[TRACK_CATALOGS[stationId].length - 1]!
}

/**
 * Final catalog position for a window. Windows are grouped into cycles of
 * one full catalog; a cycle plays every recording exactly once, so no
 * recording can repeat until the whole library has played. When a cycle's
 * opening pick collides with the previous cycle's closing pick, the first
 * two slots swap — positions 0 and 1 hold distinct recordings, so the swap
 * cannot create a new collision — and even the cycle seam never plays the
 * same recording twice in a row.
 */
function finalIndexAt(stationId: StationId, index: number): number {
  const size = TRACK_CATALOGS[stationId].length
  const cycle = Math.floor(index / size)
  const position = index - cycle * size
  const order = shuffleForCycle(stationId, cycle)
  if (position <= 1 && order[0] === lastPickOfCycle(stationId, cycle - 1)) {
    return order[1 - position]!
  }
  return order[position]!
}

/**
 * Episode for any window index. Works for arbitrarily large or negative
 * indexes, which is what makes the rotation actually infinite: the chain
 * never ends and never needs storage.
 */
export function getEpisodeAt(stationId: StationId, index: number): EpisodeReference {
  const catalog = TRACK_CATALOGS[stationId]
  const track = catalog[finalIndexAt(stationId, index)]!
  const previous = catalog[finalIndexAt(stationId, index - 1)]!
  const next = catalog[finalIndexAt(stationId, index + 1)]!

  const rng = mulberry32(hashSeed(stationSalt(stationId) ^ 0x9e3779b9, index))
  const seed = Math.floor(rng() * 0x1_0000_0000) >>> 0

  return {
    index,
    track,
    startedAtMs: index * EPISODE_WINDOW_MS,
    endsAtMs: (index + 1) * EPISODE_WINDOW_MS,
    constraint: {
      index,
      previousKey: { rootPc: previous.keyRootPc, scale: previous.scale },
      nextKey: { rootPc: next.keyRootPc, scale: next.scale },
      seed,
      keyRootPc: track.keyRootPc,
      scale: track.scale,
      energy: track.energy,
      brightness: track.brightness,
      movement: track.movement,
      swing: track.swing,
      rhythmicDensity: track.rhythmicDensity ?? track.movement,
      texture: track.texture ?? track.brightness,
    },
  }
}

/** Episode active right now for a station (or for an explicit timestamp). */
export function getCurrentEpisode(stationId: StationId, nowMs: number = Date.now()): EpisodeReference {
  return getEpisodeAt(stationId, episodeIndexAt(nowMs))
}

/** The episode that takes over when the current window closes. */
export function getUpNextEpisode(stationId: StationId, nowMs: number = Date.now()): EpisodeReference {
  return getEpisodeAt(stationId, episodeIndexAt(nowMs) + 1)
}

/** Progress (0..1) through the current episode window. */
export function episodeProgress(nowMs: number): number {
  const start = episodeIndexAt(nowMs) * EPISODE_WINDOW_MS
  return Math.min(1, Math.max(0, (nowMs - start) / EPISODE_WINDOW_MS))
}

/** Milliseconds until the current episode hands over to the next one. */
export function episodeRemainingMs(nowMs: number): number {
  const end = (episodeIndexAt(nowMs) + 1) * EPISODE_WINDOW_MS
  return Math.max(0, end - nowMs)
}
